/**
 * Persist or delete variables in the Windows user environment (HKCU\\Environment)
 * via PowerShell — no native addon required for profile installs.
 */
/**
 * Write entries into HKCU\\Environment (broadcasts WM_SETTINGCHANGE).
 * No-op on non-Windows hosts or when `entries` is empty.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function persistWindowsUserEnv(entries: Readonly<Record<string, string>>, platform?: NodeJS.Platform): void;
/**
 * Delete one user environment value from HKCU\\Environment.
 * Missing values are ignored.
 * @param name - Variable name to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function removeWindowsUserEnv(name: string, platform?: NodeJS.Platform): void;
