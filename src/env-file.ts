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

/** One physical `.env` line retained for round-trip edits. */
interface EnvLine {
  readonly kind: 'assignment' | 'other'
  readonly raw: string
  readonly name?: string
}

/**
 * Absolute path of the harness-home dotenv file.
 * @returns `$DSH_HOME/.env`.
 */
export function envFilePath(): string {
  return join(resolveDshHome(), '.env')
}

/**
 * Read non-empty string entries from `$DSH_HOME/.env`.
 * @returns Variable map, or `{}` when absent / empty.
 */
export function loadEnvMap(): Readonly<Record<string, string>> {
  const path = envFilePath()
  if (!existsSync(path)) return {}
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/u, '').trim()
  if (raw === '') return {}
  let parsed: NodeJS.ProcessEnv
  try {
    parsed = parseEnv(raw)
  } catch (error) {
    throw new Error(`custom-env: invalid dotenv syntax in ${path}`, { cause: error })
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'string' && value !== '' && isWritableEnvName(key)) out[key] = value
  }
  return out
}

/**
 * List writable entries for the settings UI.
 * @returns Path, existence, and ordered entries.
 */
export function listEnvEntries(): { path: string; exists: boolean; entries: RawEnvEntry[] } {
  const path = envFilePath()
  const exists = existsSync(path)
  const map = loadEnvMap()
  const entries = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value }))
  return { path, exists, entries }
}

/**
 * Escape a dotenv value when it needs quotes.
 * @param value - raw value.
 * @returns dotenv-encoded value token.
 */
function encodeValue(value: string): string {
  if (/^[A-Za-z0-9_./:@+-]*$/u.test(value)) return value
  return `"${value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"').replace(/\n/gu, '\\n')}"`
}

/**
 * Parse the physical file into assignment and passthrough lines.
 * @param content - file text.
 * @returns line records.
 */
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

/**
 * Serialize lines back to disk text (POSIX newlines, trailing newline).
 * @param lines - line records.
 * @returns file body.
 */
function serializeLines(lines: readonly EnvLine[]): string {
  if (lines.length === 0) return ''
  return `${lines.map(line => line.raw).join('\n')}\n`
}

/**
 * Ensure the parent of `$DSH_HOME/.env` exists, then write `content`.
 * @param content - full file body.
 */
function writeEnvFile(content: string): void {
  const path = envFilePath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
}

/**
 * Upsert one key in `$DSH_HOME/.env`, creating the file when missing.
 * @param name - variable name (must be writable).
 * @param value - non-empty value.
 */
export function upsertEnvEntry(name: string, value: string): void {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`)
  }
  if (value === '') {
    throw new Error(`custom-env: empty value for "${name}"`)
  }
  const path = envFilePath()
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const lines = parseLines(existing)
  const assignment = `${name}=${encodeValue(value)}`
  let replaced = false
  const next = lines.map((line) => {
    if (line.kind === 'assignment' && line.name === name) {
      replaced = true
      return { kind: 'assignment' as const, raw: assignment, name }
    }
    return line
  })
  if (!replaced) next.push({ kind: 'assignment', raw: assignment, name })
  writeEnvFile(serializeLines(next))
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
  const path = envFilePath()
  if (!existsSync(path)) return false
  const lines = parseLines(readFileSync(path, 'utf8'))
  const next = lines.filter(line => !(line.kind === 'assignment' && line.name === name))
  if (next.length === lines.length) return false
  writeEnvFile(serializeLines(next))
  return true
}
