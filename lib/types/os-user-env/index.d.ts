/** OS user-environment sync for Windows and macOS (no-op elsewhere). */
/**
 * Persist entries into the current user's OS environment when supported.
 * @param entries - Variable map to write.
 */
export declare function persistUserEnv(entries: Readonly<Record<string, string>>): void;
/**
 * Remove one key from the current user's OS environment when supported.
 * @param name - Variable name to delete.
 */
export declare function removeUserEnv(name: string): void;
export { persistWindowsUserEnv, removeWindowsUserEnv } from './windows.ts';
export { persistMacosUserEnv, removeMacosUserEnv } from './macos.ts';
//# sourceMappingURL=index.d.ts.map