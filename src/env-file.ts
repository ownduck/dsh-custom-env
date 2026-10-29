/** Line-oriented `$DSH_HOME/.env` read/write helpers. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { parseEnv } from 'node:util'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { isWritableEnvName } from './names.ts'
import { hasUserEnv } from './os-user-env/index.ts'

/** Name/value pair before Host baseline classification. */
export interface RawEnvEntry {
  readonly name: string
  readonly value: string
}

interface EnvLine {
  readonly kind: 'assignment' | 'other'
  readonly raw: string
  readonly name?: string
}

/** Absolute path of `$DSH_HOME/.env`. */
export function envFilePath(): string {
  return join(resolveDshHome(), '.env')
}

function readRaw(): string {
  const path = envFilePath()
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

function writeEnvFile(content: string): void {
  const path = envFilePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

function encodeValue(value: string): string {
  if (/^[A-Za-z0-9_./:@+-]*$/u.test(value)) return value
  return `"${value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"').replace(/\n/gu, '\\n')}"`
}

function parseLines(content: string): EnvLine[] {
  const text = content.replace(/^\uFEFF/u, '')
  if (text === '') return []
  return text.split(/\r?\n/u).map((raw) => {
    const trimmed = raw.trim()
    if (trimmed === '' || trimmed.startsWith('#')) return { kind: 'other', raw }
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(trimmed)
    if (match?.[1] === undefined) return { kind: 'other', raw }
    return { kind: 'assignment', raw, name: match[1] }
  })
}

/** Serialize; blank lines are dropped. */
function serializeLines(lines: readonly EnvLine[]): string {
  const kept = lines.filter(line => !(line.kind === 'other' && line.raw.trim() === ''))
  return kept.length === 0 ? '' : `${kept.map(line => line.raw).join('\n')}\n`
}

function assertWritableName(name: string): void {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`)
  }
}

/**
 * Read writable entries from `$DSH_HOME/.env` (empty values included).
 * @returns Variable map, or `{}` when absent / empty.
 */
export function readEnvMap(): Readonly<Record<string, string>> {
  const raw = readRaw().replace(/^\uFEFF/u, '').trim()
  if (raw === '') return {}
  let parsed: NodeJS.ProcessEnv
  try {
    parsed = parseEnv(raw)
  } catch (error) {
    throw new Error(`custom-env: invalid dotenv syntax in ${envFilePath()}`, { cause: error })
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string' && isWritableEnvName(key)) out[key] = value
  }
  return out
}

/**
 * List writable entries in `.env` file order (new keys stay at the end).
 * @returns Path, existence, and ordered entries.
 */
export function listEnvEntries(): { path: string; exists: boolean; entries: RawEnvEntry[] } {
  const path = envFilePath()
  const exists = existsSync(path)
  if (!exists) return { path, exists, entries: [] }
  const map = readEnvMap()
  const entries: RawEnvEntry[] = []
  const seen = new Set<string>()
  for (const line of parseLines(readRaw())) {
    if (line.kind !== 'assignment' || line.name === undefined || seen.has(line.name)) continue
    const value = map[line.name]
    if (value === undefined) continue
    seen.add(line.name)
    entries.push({ name: line.name, value })
  }
  return { path, exists, entries }
}

/** Options for empty-value write policy. */
export interface WriteEnvOptions {
  /**
   * When true, empty values always create/replace.
   * When false (default), empty values only create a missing key; existing keys
   * in `$DSH_HOME/.env` or the OS user environment are left unchanged.
   */
  readonly forceEmpty?: boolean
}

/**
 * Whether `name` already exists in `$DSH_HOME/.env` or the OS user environment.
 * Presence counts even when the current value is empty.
 * @param name - Variable name.
 * @returns true when a same-named entry is already present.
 */
export function hasEnvKey(name: string): boolean {
  return Object.hasOwn(readEnvMap(), name) || hasUserEnv(name)
}

/**
 * Drop empty writes that would clobber an existing key (unless `forceEmpty`).
 * Non-empty values always pass; last duplicate name wins.
 * @param entries - Candidate writes.
 * @param options - Empty-value policy.
 * @returns Entries that should be applied.
 */
export function selectEnvWrites(
  entries: readonly { readonly name: string; readonly value: string }[],
  options: WriteEnvOptions = {},
): RawEnvEntry[] {
  if (entries.length === 0) return []
  const lastByName = new Map<string, string>()
  for (const entry of entries) {
    assertWritableName(entry.name)
    lastByName.set(entry.name, entry.value)
  }
  const forceEmpty = options.forceEmpty === true
  const selected: RawEnvEntry[] = []
  for (const [name, value] of lastByName) {
    if (value === '' && !forceEmpty && hasEnvKey(name)) continue
    selected.push({ name, value })
  }
  return selected
}

/**
 * Create or replace many keys in one file rewrite (last duplicate name wins).
 * Existing keys keep file order; new keys append in input order.
 * Empty values write `NAME=` only when the key is absent (unless `forceEmpty`).
 * @param entries - name/value pairs.
 * @param options - Empty-value policy.
 * @returns Entries actually written (may be empty when all empty writes were skipped).
 */
export function writeEnvEntries(
  entries: readonly { readonly name: string; readonly value: string }[],
  options: WriteEnvOptions = {},
): RawEnvEntry[] {
  const selected = selectEnvWrites(entries, options)
  if (selected.length === 0) return selected
  const pending = new Map(selected.map(entry => [entry.name, entry.value]))
  const next: EnvLine[] = []
  for (const line of parseLines(readRaw())) {
    if (line.kind === 'assignment' && line.name !== undefined && pending.has(line.name)) {
      const value = pending.get(line.name)!
      pending.delete(line.name)
      next.push({
        kind: 'assignment',
        raw: `${line.name}=${encodeValue(value)}`,
        name: line.name,
      })
      continue
    }
    next.push(line)
  }
  for (const [name, value] of pending) {
    next.push({ kind: 'assignment', raw: `${name}=${encodeValue(value)}`, name })
  }
  writeEnvFile(serializeLines(next))
  return selected
}

/**
 * Create or replace one key (append when new). Honors empty-skip unless `forceEmpty`.
 * @param name - Variable name.
 * @param value - Value to store.
 * @param options - Empty-value policy.
 * @returns true when the file was rewritten.
 */
export function writeEnvEntry(name: string, value: string, options: WriteEnvOptions = {}): boolean {
  return writeEnvEntries([{ name, value }], options).length > 0
}

/**
 * Rename one key in place (keeps file order) and always write `value`.
 * @param from - Existing name.
 * @param to - New name.
 * @param value - Value to store.
 */
export function renameEnvEntry(from: string, to: string, value: string): void {
  assertWritableName(from)
  assertWritableName(to)
  const assignment = `${to}=${encodeValue(value)}`
  let replaced = false
  const next: EnvLine[] = []
  for (const line of parseLines(readRaw())) {
    if (line.kind === 'assignment' && line.name === from) {
      replaced = true
      next.push({ kind: 'assignment', raw: assignment, name: to })
      continue
    }
    if (line.kind === 'assignment' && line.name === to) continue
    next.push(line)
  }
  if (!replaced) next.push({ kind: 'assignment', raw: assignment, name: to })
  writeEnvFile(serializeLines(next))
}

/**
 * Remove many keys from `$DSH_HOME/.env` in one rewrite.
 * @param names - variable names (all must be writable).
 * @returns number of assignment lines removed.
 */
export function removeEnvEntries(names: readonly string[]): number {
  if (names.length === 0) return 0
  const drop = new Set<string>()
  for (const name of names) {
    assertWritableName(name)
    drop.add(name)
  }
  if (!existsSync(envFilePath())) return 0
  const lines = parseLines(readRaw())
  let removed = 0
  const next: EnvLine[] = []
  for (const line of lines) {
    if (line.kind === 'assignment' && line.name !== undefined && drop.has(line.name)) {
      removed += 1
      continue
    }
    next.push(line)
  }
  if (removed === 0) return 0
  writeEnvFile(serializeLines(next))
  return removed
}

/**
 * Remove one key from `$DSH_HOME/.env` when present.
 * @param name - variable name.
 * @returns true when a line was removed.
 */
export function removeEnvEntry(name: string): boolean {
  return removeEnvEntries([name]) > 0
}
