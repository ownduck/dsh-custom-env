/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */

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
import { isWritableEnvName } from './names.ts'
import { removeUserEnvs, writeUserEnv } from './os-user-env/index.ts'
import {
  classifyEntry,
  type BaselineRow,
  type CliStatus,
  type EnvEntry,
  type EnvSnapshot,
  type EnvVarWrite,
} from './types.ts'

export type { BaselineRow, CliStatus, EnvEntry, EnvSnapshot, EnvVarWrite } from './types.ts'
export { classifyEntry } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    customEnv: CustomEnvController
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'custom-env/invalid-name': { readonly name: string }
    'custom-env/invalid-value': { readonly name: string }
    'custom-env/cli-install-failed': { readonly code: string }
    'custom-env/restore-failed': { readonly name: string }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function writeLive(entries: Readonly<Record<string, string>>): void {
  for (const [key, value] of Object.entries(entries)) process.env[key] = value
  try {
    writeUserEnv(entries)
  } catch (error) {
    process.stderr.write(`custom-env: failed to write OS user environment: ${asMessage(error)}\n`)
  }
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
    writeLive(loaded)
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

  /** @returns path, existence, and file-ordered entries. */
  @Remote('list')
  async list(): Promise<EnvSnapshot> {
    const { path, exists, entries: raw } = listEnvEntries()
    const present = new Set(raw.map(entry => entry.name))
    for (const [name, id] of [...this.idByName]) {
      if (!present.has(name)) this.unbind(id)
    }
    const entries: EnvEntry[] = raw.map(({ name, value }) => {
      let id = this.idByName.get(name)
      if (id === undefined) {
        id = this.allocId()
        this.bind(id, name)
      }
      const classified = classifyEntry(id, name, value, this.baselineById)
      return { id, name, value, kind: classified.kind, previous: classified.previous }
    })
    return { path, exists, entries }
  }

  /**
   * Create or update one row. Empty `id` creates; otherwise keeps that baseline id across renames.
   * @param id - row id, or `""` for a new row.
   * @param name - variable name.
   * @param value - value (empty creates only when missing; Settings UI may still reject empty drafts).
   */
  @Remote('upsert')
  async upsert(id: string, name: string, value: string): Promise<EnvSnapshot> {
    if (id === '') {
      this.commit(name, name, value)
      if (!this.idByName.has(name)) this.bind(this.allocId(), name)
      return this.list()
    }
    const from = this.requireName(id, name)
    this.commit(from, name, value)
    this.bind(id, name)
    return this.list()
  }

  /**
   * Create or replace many variables by name (plugin-facing).
   * Non-empty values always write; empty values create missing keys only and do not
   * clear existing `$DSH_HOME/.env` or OS user values. One file rewrite; last
   * duplicate name wins. Invalid names reject the whole batch.
   * @param entries - name/value pairs.
   */
  @Remote('setVars')
  async setVars(entries: readonly EnvVarWrite[]): Promise<void> {
    if (entries.length === 0) return
    const lastByName = new Map<string, string>()
    for (const entry of entries) {
      if (!isWritableEnvName(entry.name)) {
        throw new RemoteError('custom-env/invalid-name', `refused name "${entry.name}"`, { name: entry.name })
      }
      lastByName.set(entry.name, entry.value)
    }
    const normalized: EnvVarWrite[] = [...lastByName].map(([name, value]) => ({ name, value }))
    let written: EnvVarWrite[]
    try {
      written = writeEnvEntries(normalized)
    } catch (error) {
      const name = normalized[0]?.name ?? ''
      throw new RemoteError('custom-env/invalid-name', asMessage(error), { name }, { cause: error })
    }
    if (written.length === 0) return
    const live: Record<string, string> = {}
    for (const entry of written) {
      live[entry.name] = entry.value
      if (!this.idByName.has(entry.name)) this.bind(this.allocId(), entry.name)
    }
    writeLive(live)
  }

  /**
   * Create or replace one variable by name (plugin-facing).
   * @param name - writable variable name.
   * @param value - non-empty always stores; `""` writes `NAME=` only when the key is absent.
   */
  @Remote('setVar')
  async setVar(name: string, value: string): Promise<void> {
    await this.setVars([{ name, value }])
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
