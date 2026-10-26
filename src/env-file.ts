/** Line-oriented `$DSH_HOME/.env` read/write helpers. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { parseEnv } from 'node:util'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'
import { isWritableEnvName } from './names.ts'

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

function assertWritable(name: string, value: string): void {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`)
  }
  if (value === '') {
    throw new Error(`custom-env: empty value for "${name}"`)
  }
}

/**
 * Read non-empty writable entries from `$DSH_HOME/.env`.
 * @returns Variable map, or `{}` when absent / empty.
 */
export function loadEnvMap(): Readonly<Record<string, string>> {
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
    if (typeof value === 'string' && value !== '' && isWritableEnvName(key)) out[key] = value
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
  const map = loadEnvMap()
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

/**
 * Write `name=value` in place of `replaceName` (keeps order), or append when missing.
 * Use the same name for both to update; different names to rename in place.
 * @param replaceName - line to replace.
 * @param name - name to store.
 * @param value - non-empty value.
 */
export function writeEnvEntry(replaceName: string, name: string, value: string): void {
  assertWritable(replaceName, value)
  assertWritable(name, value)
  const assignment = `${name}=${encodeValue(value)}`
  let replaced = false
  const next: EnvLine[] = []
  for (const line of parseLines(readRaw())) {
    if (line.kind === 'assignment' && line.name === replaceName) {
      replaced = true
      next.push({ kind: 'assignment', raw: assignment, name })
      continue
    }
    if (replaceName !== name && line.kind === 'assignment' && line.name === name) continue
    next.push(line)
  }
  if (!replaced) next.push({ kind: 'assignment', raw: assignment, name })
  writeEnvFile(serializeLines(next))
}

/** Create or replace one key (append when new). */
export function upsertEnvEntry(name: string, value: string): void {
  writeEnvEntry(name, name, value)
}

/** Rename one key in place (keeps file order). */
export function renameEnvEntry(from: string, to: string, value: string): void {
  writeEnvEntry(from, to, value)
}

/**
 * Remove one key from `$DSH_HOME/.env` when present.
 * @param name - variable name.
 * @returns true when a line was removed.
 */
export function removeEnvEntry(name: string): boolean {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`)
  }
  if (!existsSync(envFilePath())) return false
  const lines = parseLines(readRaw())
  const next = lines.filter(line => !(line.kind === 'assignment' && line.name === name))
  if (next.length === lines.length) return false
  writeEnvFile(serializeLines(next))
  return true
}
