/** OS user-environment sync for Windows and macOS (no-op elsewhere). */
/**
 * Whether `name` already exists in the OS user environment (Windows HKCU or macOS user domain).
 * @param name - Variable name.
 * @returns true when present (value may be empty); false on unsupported platforms.
 */
export declare function hasUserEnv(name: string): boolean;
/**
 * Write entries into the current user's OS environment when supported.
 * @param entries - Variable map to write.
 */
export declare function writeUserEnv(entries: Readonly<Record<string, string>>): void;
/**
 * Remove many keys from the current user's OS environment when supported.
 * @param names - Variable names to delete.
 */
export declare function removeUserEnvs(names: readonly string[]): void;
/**
 * Remove one key from the current user's OS environment when supported.
 * @param name - Variable name to delete.
 */
export declare function removeUserEnv(name: string): void;
export { hasWindowsUserEnv, removeWindowsUserEnv, removeWindowsUserEnvs, writeWindowsUserEnv, } from './windows.ts';
export { hasMacosUserEnv, removeMacosUserEnv, removeMacosUserEnvs, writeMacosUserEnv, } from './macos.ts';
