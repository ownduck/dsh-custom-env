/**
 * Persist or delete variables in the Windows user environment (HKCU\\Environment)
 * via PowerShell — no native addon required for profile installs.
 */

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

/**
 * Run a PowerShell snippet and throw on non-zero exit.
 * @param script - PowerShell source.
 */
function runPowerShell(script: string): void {
  const systemRoot = process.env.SystemRoot ?? process.env.WINDIR ?? 'C:\\Windows'
  const shell = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  const result = spawnSync(
    shell,
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { encoding: 'utf8', windowsHide: true },
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`custom-env: PowerShell failed${detail === '' ? '' : `: ${detail}`}`)
  }
}

/**
 * Escape a string for a single-quoted PowerShell literal.
 * @param value - raw text.
 * @returns PowerShell single-quoted string.
 */
function psQuote(value: string): string {
  return `'${value.replace(/'/gu, "''")}'`
}

/**
 * Write entries into HKCU\\Environment (broadcasts WM_SETTINGCHANGE).
 * No-op on non-Windows hosts or when `entries` is empty.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function persistWindowsUserEnv(
  entries: Readonly<Record<string, string>>,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'win32') return
  const pairs = Object.entries(entries)
  if (pairs.length === 0) return

  const script = pairs
    .map(([name, value]) => `[Environment]::SetEnvironmentVariable(${psQuote(name)}, ${psQuote(value)}, 'User')`)
    .join('; ')
  runPowerShell(script)
}

/**
 * Delete one user environment value from HKCU\\Environment.
 * Missing values are ignored.
 * @param name - Variable name to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function removeWindowsUserEnv(
  name: string,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'win32') return
  runPowerShell(`[Environment]::SetEnvironmentVariable(${psQuote(name)}, $null, 'User')`)
}
