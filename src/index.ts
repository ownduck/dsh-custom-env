/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */

import type { ChildProcess } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { cliInstall as installCli, cliStatus as readCliStatus } from './cli-path/index.ts'
import {
  envFilePath,
  listEnvEntries,
  readEnvMap,
  removeEnvEntries,
  renameEnvEntry,
  writeEnvEntries,
  writeEnvEntry,
} from './env-file.ts'
import {
  DEFAULT_GROUP_ID,
  clearMembershipMany,
  createGroup as createGroupMeta,
  deleteGroupMeta,
  hasGroup,
  pruneMembership,
  readGroupsFile,
  renameGroup as renameGroupMeta,
  resolveGroupId,
  setMembership,
  writeGroupsFile,
  type GroupsFile,
} from './groups-store.ts'
import { isWritableEnvName } from './names.ts'
import { removeUserEnvs, writeUserEnv } from './os-user-env/index.ts'
import { startWriteUserEnvChild } from './os-user-env/write-user-env-child.ts'
import {
  classifyEntry,
  type BaselineRow,
  type CliStatus,
  type DeleteGroupOptions,
  type EnvEntry,
  type EnvGroup,
  type EnvSnapshot,
  type EnvVarWrite,
} from './types.ts'

export type {
  BaselineRow, CliStatus, DeleteGroupOptions, EnvEntry, EnvGroup, EnvSnapshot, EnvVarWrite,
} from './types.ts'
export { classifyEntry } from './types.ts'
export { DEFAULT_GROUP_ID, DEFAULT_GROUP_TITLE } from './group-ids.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    customEnv: CustomEnvController
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'custom-env/invalid-name': { readonly name: string }
    'custom-env/invalid-value': { readonly name: string }
    'custom-env/invalid-group': { readonly group: string }
    'custom-env/cli-install-failed': { readonly code: string }
    'custom-env/restore-failed': { readonly name: string }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Inject into the current Host process only (cheap; needed before other plugins read env). */
function applyProcessEnv(entries: Readonly<Record<string, string>>): void {
  for (const [key, value] of Object.entries(entries)) process.env[key] = value
}

/** Persist into the OS user environment (HKCU / launchctl); may take longer than process.env. */
function applyOsUserEnv(entries: Readonly<Record<string, string>>): void {
  if (Object.keys(entries).length === 0) return
  try {
    writeUserEnv(entries)
  } catch (error) {
    process.stderr.write(`custom-env: failed to write OS user environment: ${asMessage(error)}\n`)
  }
}

/**
 * After boot sync work, persist OS user env in a child process (koffi-safe for Electron).
 * Falls back to an in-process write when the child script is missing or cannot start.
 */
function scheduleOsUserEnvSync(ctx: Context, entries: Readonly<Record<string, string>>): void {
  if (Object.keys(entries).length === 0) return
  let child: ChildProcess | undefined
  const handle = setImmediate(() => {
    try {
      child = startWriteUserEnvChild(entries)
      if (child === undefined) {
        applyOsUserEnv(entries)
        return
      }
      child.on('error', error => {
        process.stderr.write(
          `custom-env: OS user env child failed (${asMessage(error)}); falling back to sync write\n`,
        )
        applyOsUserEnv(entries)
      })
    } catch (error) {
      process.stderr.write(
        `custom-env: could not start OS user env child (${asMessage(error)}); falling back to sync write\n`,
      )
      applyOsUserEnv(entries)
    }
  })
  ctx.effect(() => () => {
    clearImmediate(handle)
    child?.kill()
  }, 'custom-env: deferred OS env sync')
}

/** Sync process.env and OS user environment (used by Settings / Remote writes). */
function writeLive(entries: Readonly<Record<string, string>>): void {
  applyProcessEnv(entries)
  applyOsUserEnv(entries)
}

function removeLives(names: readonly string[]): void {
  if (names.length === 0) return
  for (const name of names) delete process.env[name]
  try {
    removeUserEnvs(names)
  } catch (error) {
    process.stderr.write(
      `custom-env: failed to remove OS user environment (${names.join(', ')}): ${asMessage(error)}\n`,
    )
  }
}

function removeLive(name: string): void {
  removeLives([name])
}

/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */
export default class CustomEnvController extends TypertRemoteService {
  private readonly baselineById = new Map<string, BaselineRow>()
  private readonly idByName = new Map<string, string>()
  private readonly nameById = new Map<string, string>()
  private idSeq = 0

  constructor(ctx: Context) {
    super(ctx, 'customEnv')
    const loaded = readEnvMap()
    for (const [name, value] of Object.entries(loaded)) {
      const id = this.allocId()
      this.bind(id, name)
      this.baselineById.set(id, { name, value })
    }
    // process.env must apply before later plugins load; OS user env is deferred off-boot.
    applyProcessEnv(loaded)
    scheduleOsUserEnvSync(ctx, loaded)
  }

  private allocId(): string {
    return `env-${++this.idSeq}`
  }

  private bind(id: string, name: string): void {
    const previous = this.nameById.get(id)
    if (previous !== undefined) this.idByName.delete(previous)
    this.nameById.set(id, name)
    this.idByName.set(name, id)
  }

  private unbind(id: string): void {
    const name = this.nameById.get(id)
    if (name !== undefined) this.idByName.delete(name)
    this.nameById.delete(id)
  }

  private requireName(id: string, forError: string): string {
    const name = this.nameById.get(id)
    if (name === undefined) {
      throw new RemoteError('custom-env/invalid-name', `unknown row id "${id}"`, { name: forError })
    }
    return name
  }

  private loadGroups(): GroupsFile {
    return readGroupsFile()
  }

  private saveGroups(file: GroupsFile): void {
    writeGroupsFile(file)
  }

  private requireGroup(file: GroupsFile, groupId: string): string {
    const id = groupId.trim() === '' ? DEFAULT_GROUP_ID : groupId
    if (!hasGroup(file, id)) {
      throw new RemoteError('custom-env/invalid-group', `unknown group "${id}"`, { group: id })
    }
    return id
  }

  /**
   * Write `name=value` replacing `from` in place; sync process.env / OS.
   * Empty values create missing keys only, unless `forceEmpty` (restore).
   */
  private commit(from: string, name: string, value: string, forceEmpty = false): void {
    if (!isWritableEnvName(name) || (from !== name && !isWritableEnvName(from))) {
      throw new RemoteError('custom-env/invalid-name', `refused name "${name}"`, { name })
    }
    try {
      if (from === name) {
        if (!writeEnvEntry(name, value, { forceEmpty })) return
      } else {
        renameEnvEntry(from, name, value)
        removeLive(from)
      }
    } catch (error) {
      throw new RemoteError('custom-env/invalid-name', asMessage(error), { name }, { cause: error })
    }
    writeLive({ [name]: value })
  }

  /** @returns path, existence, groups, and file-ordered entries. */
  @Remote('list')
  async list(): Promise<EnvSnapshot> {
    const { path, exists, entries: raw } = listEnvEntries()
    const present = new Set(raw.map(entry => entry.name))
    for (const [name, id] of [...this.idByName]) {
      if (!present.has(name)) this.unbind(id)
    }
    let groupsFile = this.loadGroups()
    const entries: EnvEntry[] = raw.map(({ name, value }) => {
      let id = this.idByName.get(name)
      if (id === undefined) {
        id = this.allocId()
        this.bind(id, name)
      }
      const classified = classifyEntry(id, name, value, this.baselineById)
      const groupId = resolveGroupId(groupsFile, id)
      return { id, name, value, groupId, kind: classified.kind, previous: classified.previous }
    })
    const liveIds = new Set(entries.map(entry => entry.id))
    const pruned = pruneMembership(groupsFile, liveIds)
    if (pruned !== groupsFile) {
      this.saveGroups(pruned)
      groupsFile = pruned
    }
    return { path, exists, groups: groupsFile.groups, entries }
  }

  /**
   * Create or update one row. Empty `id` creates; otherwise keeps that baseline id across renames.
   * @param id - row id, or `""` for a new row.
   * @param name - variable name.
   * @param value - value (empty creates only when missing; Settings UI may still reject empty drafts).
   * @param groupId - required for create semantics (`id === ""`, defaults to `default`);
   *   on update, omit to keep membership, or pass to reassign (same as `moveEntry`).
   */
  @Remote('upsert')
  async upsert(id: string, name: string, value: string, groupId?: string): Promise<EnvSnapshot> {
    if (id === '') {
      let groupsFile = this.loadGroups()
      const target = this.requireGroup(groupsFile, groupId ?? DEFAULT_GROUP_ID)
      this.commit(name, name, value)
      let rowId = this.idByName.get(name)
      if (rowId === undefined) {
        rowId = this.allocId()
        this.bind(rowId, name)
      }
      groupsFile = setMembership(groupsFile, rowId, target)
      this.saveGroups(groupsFile)
      return this.list()
    }
    const from = this.requireName(id, name)
    this.commit(from, name, value)
    this.bind(id, name)
    if (groupId !== undefined) {
      let groupsFile = this.loadGroups()
      const target = this.requireGroup(groupsFile, groupId)
      groupsFile = setMembership(groupsFile, id, target)
      this.saveGroups(groupsFile)
    }
    return this.list()
  }

  /**
   * Create or replace many variables by name (plugin-facing).
   * Non-empty values always write; empty values create missing keys only and do not
   * clear existing `$DSH_HOME/.env` or OS user values. One file rewrite; last
   * duplicate name wins. Invalid names reject the whole batch.
   * @param entries - name/value pairs; optional `group` assigns membership when set.
   *   Omitted `group`: new names → `default`; existing names keep their group.
   */
  @Remote('setVars')
  async setVars(entries: readonly EnvVarWrite[]): Promise<void> {
    if (entries.length === 0) return
    let groupsFile = this.loadGroups()
    const lastByName = new Map<string, { value: string; group?: string }>()
    for (const entry of entries) {
      if (!isWritableEnvName(entry.name)) {
        throw new RemoteError('custom-env/invalid-name', `refused name "${entry.name}"`, { name: entry.name })
      }
      if (entry.group !== undefined) {
        const group = this.requireGroup(groupsFile, entry.group)
        lastByName.set(entry.name, { value: entry.value, group })
      } else {
        lastByName.set(entry.name, { value: entry.value })
      }
    }
    const normalized: EnvVarWrite[] = [...lastByName].map(([name, { value }]) => ({ name, value }))
    let written: EnvVarWrite[]
    try {
      written = writeEnvEntries(normalized)
    } catch (error) {
      const name = normalized[0]?.name ?? ''
      throw new RemoteError('custom-env/invalid-name', asMessage(error), { name }, { cause: error })
    }
    if (written.length === 0) return
    const live: Record<string, string> = {}
    let membershipChanged = false
    for (const entry of written) {
      live[entry.name] = entry.value
      let rowId = this.idByName.get(entry.name)
      const isNewRow = rowId === undefined
      if (rowId === undefined) {
        rowId = this.allocId()
        this.bind(rowId, entry.name)
      }
      const explicitGroup = lastByName.get(entry.name)?.group
      if (explicitGroup !== undefined) {
        groupsFile = setMembership(groupsFile, rowId, explicitGroup)
        membershipChanged = true
      } else if (isNewRow) {
        groupsFile = setMembership(groupsFile, rowId, DEFAULT_GROUP_ID)
        membershipChanged = true
      }
    }
    if (membershipChanged) this.saveGroups(groupsFile)
    writeLive(live)
  }

  /**
   * Create or replace one variable by name (plugin-facing).
   * @param name - writable variable name.
   * @param value - non-empty always stores; `""` writes `NAME=` only when the key is absent.
   * @param group - optional group id; when omitted, new names use `default` and existing keep theirs.
   */
  @Remote('setVar')
  async setVar(name: string, value: string, group?: string): Promise<void> {
    await this.setVars([{ name, value, group }])
  }

  /**
   * Remove many variables by name (plugin-facing).
   * @param names - writable variable names.
   * @returns number of `.env` lines removed.
   */
  @Remote('removeVars')
  async removeVars(names: readonly string[]): Promise<number> {
    if (names.length === 0) return 0
    const unique: string[] = []
    const seen = new Set<string>()
    for (const name of names) {
      if (!isWritableEnvName(name)) {
        throw new RemoteError('custom-env/invalid-name', `refused name "${name}"`, { name })
      }
      if (seen.has(name)) continue
      seen.add(name)
      unique.push(name)
    }
    const dropIds: string[] = []
    for (const name of unique) {
      const id = this.idByName.get(name)
      if (id !== undefined) dropIds.push(id)
    }
    let removed: number
    try {
      removed = removeEnvEntries(unique)
    } catch (error) {
      const name = unique[0] ?? ''
      throw new RemoteError('custom-env/invalid-name', asMessage(error), { name }, { cause: error })
    }
    removeLives(unique)
    for (const name of unique) {
      const id = this.idByName.get(name)
      if (id !== undefined) this.unbind(id)
    }
    if (dropIds.length > 0) {
      this.saveGroups(clearMembershipMany(this.loadGroups(), dropIds))
    }
    return removed
  }

  /**
   * Remove one variable by name (plugin-facing).
   * @param name - writable variable name.
   * @returns true when a `.env` line was removed.
   */
  @Remote('removeVar')
  async removeVar(name: string): Promise<boolean> {
    return (await this.removeVars([name])) > 0
  }

  /** @param id - row id from list(). */
  @Remote('deleteEntry')
  async deleteEntry(id: string): Promise<EnvSnapshot> {
    const name = this.requireName(id, id)
    await this.removeVars([name])
    return this.list()
  }

  /** Restore Host-start original name+value, or delete if added after start. */
  @Remote('restore')
  async restore(id: string): Promise<EnvSnapshot> {
    const name = this.nameById.get(id)
    if (name === undefined) {
      throw new RemoteError('custom-env/restore-failed', `unknown row id "${id}"`, { name: id })
    }
    const base = this.baselineById.get(id)
    if (base === undefined) return this.deleteEntry(id)
    if (name === base.name && readEnvMap()[base.name] === base.value) return this.list()
    try {
      this.commit(name, base.name, base.value, true)
    } catch (error) {
      if (error instanceof RemoteError) {
        throw new RemoteError('custom-env/restore-failed', error.message, { name }, { cause: error })
      }
      throw new RemoteError('custom-env/restore-failed', asMessage(error), { name }, { cause: error })
    }
    this.bind(id, base.name)
    return this.list()
  }

  /**
   * Create a custom group.
   * @param title - Non-empty display title.
   */
  @Remote('createGroup')
  async createGroup(title: string): Promise<EnvGroup> {
    try {
      const { file, group } = createGroupMeta(this.loadGroups(), title)
      this.saveGroups(file)
      return group
    } catch (error) {
      throw new RemoteError('custom-env/invalid-group', asMessage(error), { group: title }, { cause: error })
    }
  }

  /**
   * Rename a custom group (not the default group).
   * @param id - Group id.
   * @param title - New title.
   */
  @Remote('renameGroup')
  async renameGroup(id: string, title: string): Promise<EnvGroup> {
    try {
      const file = renameGroupMeta(this.loadGroups(), id, title)
      this.saveGroups(file)
      const group = file.groups.find(item => item.id === id)
      if (group === undefined) {
        throw new RemoteError('custom-env/invalid-group', `unknown group "${id}"`, { group: id })
      }
      return group
    } catch (error) {
      if (error instanceof RemoteError) throw error
      throw new RemoteError('custom-env/invalid-group', asMessage(error), { group: id }, { cause: error })
    }
  }

  /**
   * Delete a custom group.
   * @param id - Group id (not `default`).
   * @param options - When `moveToDefault` is false, member variables are removed from `.env`.
   */
  @Remote('deleteGroup')
  async deleteGroup(id: string, options: DeleteGroupOptions): Promise<EnvSnapshot> {
    let meta
    try {
      meta = deleteGroupMeta(this.loadGroups(), id, options.moveToDefault)
    } catch (error) {
      throw new RemoteError('custom-env/invalid-group', asMessage(error), { group: id }, { cause: error })
    }
    if (!options.moveToDefault && meta.memberIds.length > 0) {
      const names: string[] = []
      for (const entryId of meta.memberIds) {
        const name = this.nameById.get(entryId)
        if (name !== undefined) names.push(name)
      }
      if (names.length > 0) {
        try {
          removeEnvEntries(names)
        } catch (error) {
          throw new RemoteError('custom-env/invalid-name', asMessage(error), { name: names[0]! }, { cause: error })
        }
        removeLives(names)
        for (const name of names) {
          const entryId = this.idByName.get(name)
          if (entryId !== undefined) this.unbind(entryId)
        }
      }
    }
    this.saveGroups(meta.file)
    return this.list()
  }

  /**
   * Move one row into another group.
   * @param id - Row id.
   * @param groupId - Target group id.
   */
  @Remote('moveEntry')
  async moveEntry(id: string, groupId: string): Promise<EnvSnapshot> {
    this.requireName(id, id)
    let groupsFile = this.loadGroups()
    const target = this.requireGroup(groupsFile, groupId)
    groupsFile = setMembership(groupsFile, id, target)
    this.saveGroups(groupsFile)
    return this.list()
  }

  @Remote('cliStatus')
  async cliStatus(): Promise<CliStatus> {
    return readCliStatus()
  }

  @Remote('cliInstall')
  async cliInstall(): Promise<CliStatus> {
    try {
      return await installCli()
    } catch (error) {
      const code = typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : 'EIO'
      throw new RemoteError('custom-env/cli-install-failed', asMessage(error), { code }, { cause: error })
    }
  }
}

export { envFilePath }
