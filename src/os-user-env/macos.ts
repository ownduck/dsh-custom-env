/**
 * Persist user environment variables on macOS via launchctl and a Login LaunchAgent.
 */

import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const AGENT_LABEL = 'ai.dsh.custom-env'
const AGENT_DIR = () => join(homedir(), 'Library', 'LaunchAgents')
const AGENT_PATH = () => join(AGENT_DIR(), `${AGENT_LABEL}.plist`)

/** In-memory agent map for this process; reloaded from disk on first mutate. */
let cached: Record<string, string> | undefined

/**
 * Escape a string for embedding in a LaunchAgent plist.
 * @param value - raw text.
 * @returns XML-safe text.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
}

/**
 * Build a LaunchAgent plist that exports `entries` at login.
 * @param entries - environment map.
 * @returns plist XML.
 */
function buildPlist(entries: Readonly<Record<string, string>>): string {
  const pairs = Object.entries(entries)
    .map(([key, value]) => `    <key>${escapeXml(key)}</key>\n    <string>${escapeXml(value)}</string>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/true</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
${pairs}
  </dict>
</dict>
</plist>
`
}

function launchctl(args: readonly string[]): void {
  const result = spawnSync('launchctl', args, { encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`custom-env: launchctl ${args.join(' ')} failed${detail === '' ? '' : `: ${detail}`}`)
  }
}

function ensureCache(): Record<string, string> {
  if (cached !== undefined) return cached
  cached = {}
  return cached
}

function writeAgent(entries: Readonly<Record<string, string>>): void {
  const path = AGENT_PATH()
  if (Object.keys(entries).length === 0) {
    if (existsSync(path)) {
      try { launchctl(['unload', path]) } catch (_error) { /* agent may already be unloaded */ }
      unlinkSync(path)
    }
    return
  }
  mkdirSync(AGENT_DIR(), { recursive: true })
  writeFileSync(path, buildPlist(entries), 'utf8')
  try { launchctl(['unload', path]) } catch (_error) { /* first install */ }
  launchctl(['load', path])
}

/**
 * Whether `name` is present in this process's macOS user-env tracking
 * (`process.env` or the in-memory LaunchAgent cache).
 * @param name - Variable name.
 * @param platform - Override for tests; defaults to `process.platform`.
 * @returns true when the name is already managed/visible.
 */
export function hasMacosUserEnv(
  name: string,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (platform !== 'darwin') return false
  if (Object.hasOwn(process.env, name)) return true
  return Object.hasOwn(ensureCache(), name)
}

/**
 * Set user-domain environment variables for new GUI sessions and refresh the Login Agent.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function writeMacosUserEnv(
  entries: Readonly<Record<string, string>>,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'darwin') return
  const pairs = Object.entries(entries)
  if (pairs.length === 0) return
  const map = ensureCache()
  for (const [name, value] of pairs) {
    map[name] = value
    launchctl(['setenv', name, value])
  }
  writeAgent(map)
}

/**
 * Unset many user-domain environment variables and refresh the Login Agent once.
 * @param names - Variable names to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function removeMacosUserEnvs(
  names: readonly string[],
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'darwin' || names.length === 0) return
  const map = ensureCache()
  for (const name of names) {
    delete map[name]
    try { launchctl(['unsetenv', name]) } catch (_error) { /* already unset */ }
  }
  writeAgent(map)
}

/**
 * Unset one user-domain environment variable and refresh the Login Agent.
 * @param name - Variable name to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function removeMacosUserEnv(
  name: string,
  platform: NodeJS.Platform = process.platform,
): void {
  removeMacosUserEnvs([name], platform)
}

