/** OS user-environment sync for Windows and macOS (no-op elsewhere). */

import { persistMacosUserEnv, removeMacosUserEnv, removeMacosUserEnvMany } from './macos.ts'
import { persistWindowsUserEnv, removeWindowsUserEnv, removeWindowsUserEnvMany } from './windows.ts'

/**
 * Persist entries into the current user's OS environment when supported.
 * @param entries - Variable map to write.
 */
export function persistUserEnv(entries: Readonly<Record<string, string>>): void {
  persistWindowsUserEnv(entries)
  persistMacosUserEnv(entries)
}

/**
 * Remove many keys from the current user's OS environment when supported.
 * @param names - Variable names to delete.
 */
export function removeUserEnvMany(names: readonly string[]): void {
  if (names.length === 0) return
  removeWindowsUserEnvMany(names)
  removeMacosUserEnvMany(names)
}

/**
 * Remove one key from the current user's OS environment when supported.
 * @param name - Variable name to delete.
 */
export function removeUserEnv(name: string): void {
  removeUserEnvMany([name])
}

export {
  persistWindowsUserEnv,
  removeWindowsUserEnv,
  removeWindowsUserEnvMany,
} from './windows.ts'
export {
  persistMacosUserEnv,
  removeMacosUserEnv,
  removeMacosUserEnvMany,
} from './macos.ts'
