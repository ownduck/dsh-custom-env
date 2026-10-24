/** OS user-environment sync for Windows and macOS (no-op elsewhere). */

import { persistMacosUserEnv, removeMacosUserEnv } from './macos.ts'
import { persistWindowsUserEnv, removeWindowsUserEnv } from './windows.ts'

/**
 * Persist entries into the current user's OS environment when supported.
 * @param entries - Variable map to write.
 */
export function persistUserEnv(entries: Readonly<Record<string, string>>): void {
  persistWindowsUserEnv(entries)
  persistMacosUserEnv(entries)
}

/**
 * Remove one key from the current user's OS environment when supported.
 * @param name - Variable name to delete.
 */
export function removeUserEnv(name: string): void {
  removeWindowsUserEnv(name)
  removeMacosUserEnv(name)
}

export { persistWindowsUserEnv, removeWindowsUserEnv } from './windows.ts'
export { persistMacosUserEnv, removeMacosUserEnv } from './macos.ts'
