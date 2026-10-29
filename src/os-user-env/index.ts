/** OS user-environment sync for Windows and macOS (no-op elsewhere). */

import { hasMacosUserEnv, removeMacosUserEnv, removeMacosUserEnvs, writeMacosUserEnv } from './macos.ts'
import { hasWindowsUserEnv, removeWindowsUserEnv, removeWindowsUserEnvs, writeWindowsUserEnv } from './windows.ts'

/**
 * Whether `name` already exists in the OS user environment (Windows HKCU or macOS user domain).
 * @param name - Variable name.
 * @returns true when present (value may be empty); false on unsupported platforms.
 */
export function hasUserEnv(name: string): boolean {
  return hasWindowsUserEnv(name) || hasMacosUserEnv(name)
}

/**
 * Write entries into the current user's OS environment when supported.
 * @param entries - Variable map to write.
 */
export function writeUserEnv(entries: Readonly<Record<string, string>>): void {
  writeWindowsUserEnv(entries)
  writeMacosUserEnv(entries)
}

/**
 * Remove many keys from the current user's OS environment when supported.
 * @param names - Variable names to delete.
 */
export function removeUserEnvs(names: readonly string[]): void {
  if (names.length === 0) return
  removeWindowsUserEnvs(names)
  removeMacosUserEnvs(names)
}

/**
 * Remove one key from the current user's OS environment when supported.
 * @param name - Variable name to delete.
 */
export function removeUserEnv(name: string): void {
  removeUserEnvs([name])
}

export {
  hasWindowsUserEnv,
  removeWindowsUserEnv,
  removeWindowsUserEnvs,
  writeWindowsUserEnv,
} from './windows.ts'
export {
  hasMacosUserEnv,
  removeMacosUserEnv,
  removeMacosUserEnvs,
  writeMacosUserEnv,
} from './macos.ts'
