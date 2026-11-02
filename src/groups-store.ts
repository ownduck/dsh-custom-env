/** Sidecar JSON for environment variable groups (UI / plugin metadata only). */

import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_TITLE } from './group-ids.ts'
import type { EnvGroup } from './types.ts'

export { DEFAULT_GROUP_ID, DEFAULT_GROUP_TITLE } from './group-ids.ts'

/** On-disk groups document. */
export interface GroupsFile {
  readonly version: 1
  readonly groups: readonly EnvGroup[]
  /** entryId → groupId */
  readonly membership: Readonly<Record<string, string>>
}

/** Absolute path of `$DSH_HOME/.dsh-custom-env-groups.json`. */
export function groupsFilePath(): string {
  return join(resolveDshHome(), '.dsh-custom-env-groups.json')
}

function defaultFile(): GroupsFile {
  return {
    version: 1,
    groups: [{ id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE }],
    membership: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Normalize arbitrary JSON into a valid groups file (always includes default).
 * @param raw - Parsed JSON or undefined.
 */
export function normalizeGroupsFile(raw: unknown): GroupsFile {
  if (!isRecord(raw)) return defaultFile()
  const groupsIn = Array.isArray(raw.groups) ? raw.groups : []
  const groups: EnvGroup[] = []
  const seen = new Set<string>()
  let hasDefault = false
  for (const item of groupsIn) {
    if (!isRecord(item)) continue
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (id === '' || title === '' || seen.has(id)) continue
    seen.add(id)
    if (id === DEFAULT_GROUP_ID) {
      hasDefault = true
      groups.unshift({ id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE })
      continue
    }
    groups.push({ id, title })
  }
  if (!hasDefault) groups.unshift({ id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE })

  const groupIds = new Set(groups.map(group => group.id))
  const membership: Record<string, string> = {}
  if (isRecord(raw.membership)) {
    for (const [entryId, groupId] of Object.entries(raw.membership)) {
      if (typeof groupId !== 'string' || entryId.trim() === '' || groupId.trim() === '') continue
      membership[entryId] = groupIds.has(groupId) ? groupId : DEFAULT_GROUP_ID
    }
  }
  return { version: 1, groups, membership }
}

/** Read and normalize the groups sidecar (missing file → default only). */
export function readGroupsFile(): GroupsFile {
  const path = groupsFilePath()
  if (!existsSync(path)) return defaultFile()
  try {
    return normalizeGroupsFile(JSON.parse(readFileSync(path, 'utf8')) as unknown)
  } catch {
    return defaultFile()
  }
}

/** Persist a groups file under `$DSH_HOME`. */
export function writeGroupsFile(file: GroupsFile): void {
  const path = groupsFilePath()
  mkdirSync(dirname(path), { recursive: true })
  const normalized = normalizeGroupsFile(file)
  writeFileSync(path, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
}

/**
 * Drop membership keys that no longer exist as live row ids.
 * @param file - Current groups file.
 * @param liveIds - Row ids still present.
 */
export function pruneMembership(file: GroupsFile, liveIds: ReadonlySet<string>): GroupsFile {
  let changed = false
  const membership: Record<string, string> = {}
  for (const [entryId, groupId] of Object.entries(file.membership)) {
    if (!liveIds.has(entryId)) {
      changed = true
      continue
    }
    membership[entryId] = groupId
  }
  return changed ? { ...file, membership } : file
}

/**
 * Resolve the group for a row id (missing → default).
 * @param file - Groups file.
 * @param entryId - Stable row id.
 */
export function resolveGroupId(file: GroupsFile, entryId: string): string {
  const groupId = file.membership[entryId]
  if (groupId === undefined) return DEFAULT_GROUP_ID
  return file.groups.some(group => group.id === groupId) ? groupId : DEFAULT_GROUP_ID
}

/**
 * Assign a row to a group.
 * @param file - Groups file.
 * @param entryId - Row id.
 * @param groupId - Target group (must exist, or default).
 */
export function setMembership(file: GroupsFile, entryId: string, groupId: string): GroupsFile {
  const nextId = file.groups.some(group => group.id === groupId) ? groupId : DEFAULT_GROUP_ID
  if (file.membership[entryId] === nextId) return file
  return { ...file, membership: { ...file.membership, [entryId]: nextId } }
}

/** Remove one row from membership. */
export function clearMembership(file: GroupsFile, entryId: string): GroupsFile {
  if (file.membership[entryId] === undefined) return file
  const membership = { ...file.membership }
  delete membership[entryId]
  return { ...file, membership }
}

/** Remove many rows from membership. */
export function clearMembershipMany(file: GroupsFile, entryIds: readonly string[]): GroupsFile {
  let next = file
  for (const entryId of entryIds) next = clearMembership(next, entryId)
  return next
}

function allocGroupId(existing: ReadonlySet<string>): string {
  for (;;) {
    const id = `g-${randomBytes(6).toString('hex')}`
    if (!existing.has(id)) return id
  }
}

/**
 * Append a custom group.
 * @param file - Groups file.
 * @param title - Non-empty display title.
 */
export function createGroup(file: GroupsFile, title: string): { readonly file: GroupsFile; readonly group: EnvGroup } {
  const trimmed = title.trim()
  if (trimmed === '') throw new Error('empty group title')
  const existing = new Set(file.groups.map(group => group.id))
  const group: EnvGroup = { id: allocGroupId(existing), title: trimmed }
  return { file: { ...file, groups: [...file.groups, group] }, group }
}

/**
 * Rename a custom group (not default).
 * @param file - Groups file.
 * @param id - Group id.
 * @param title - New title.
 */
export function renameGroup(file: GroupsFile, id: string, title: string): GroupsFile {
  if (id === DEFAULT_GROUP_ID) throw new Error('cannot rename default group')
  const trimmed = title.trim()
  if (trimmed === '') throw new Error('empty group title')
  const index = file.groups.findIndex(group => group.id === id)
  if (index < 0) throw new Error(`unknown group "${id}"`)
  const groups = file.groups.map((group, i) => (i === index ? { id, title: trimmed } : group))
  return { ...file, groups }
}

/**
 * Delete a custom group and either move or drop its membership keys.
 * Does not delete `.env` values — caller handles variable deletion when needed.
 * @param file - Groups file.
 * @param id - Group id to remove.
 * @param moveToDefault - When true, reassign members to default; else clear membership.
 */
export function deleteGroupMeta(
  file: GroupsFile,
  id: string,
  moveToDefault: boolean,
): { readonly file: GroupsFile; readonly memberIds: readonly string[] } {
  if (id === DEFAULT_GROUP_ID) throw new Error('cannot delete default group')
  if (!file.groups.some(group => group.id === id)) throw new Error(`unknown group "${id}"`)
  const memberIds = Object.entries(file.membership)
    .filter(([, groupId]) => groupId === id)
    .map(([entryId]) => entryId)
  const membership: Record<string, string> = { ...file.membership }
  for (const entryId of memberIds) {
    if (moveToDefault) membership[entryId] = DEFAULT_GROUP_ID
    else delete membership[entryId]
  }
  return {
    file: {
      ...file,
      groups: file.groups.filter(group => group.id !== id),
      membership,
    },
    memberIds,
  }
}

/** Whether `groupId` exists in the file (including default). */
export function hasGroup(file: GroupsFile, groupId: string): boolean {
  return file.groups.some(group => group.id === groupId)
}
