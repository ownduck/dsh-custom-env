/**
 * Persist or delete variables in the Windows user environment (HKCU\\Environment)
 * via koffi + advapi32 — no WM_SETTINGCHANGE broadcast (Host already updates process.env).
 */
/** Win32 registry calls used to persist user environment values. */
export interface WindowsUserEnvBindings {
    readonly openKey: (hKey: number, subKey: string, options: number, samDesired: number, result: [unknown]) => number;
    readonly queryValue: (hKey: unknown, valueName: string, reserved: unknown, type: [number] | null, data: Buffer | null, cbData: [number]) => number;
    readonly setValue: (hKey: unknown, valueName: string, reserved: number, type: number, data: Buffer, cbData: number) => number;
    readonly deleteValue: (hKey: unknown, valueName: string) => number;
    readonly closeKey: (hKey: unknown) => number;
}
/**
 * Install FFI bindings for tests (skips loading koffi).
 * @param next - Mock bindings, or `undefined` to clear the cache.
 */
export declare function setWindowsUserEnvBindingsForTests(next: WindowsUserEnvBindings | undefined): void;
/**
 * Encode a REG_SZ payload (UTF-16LE including trailing NUL).
 * @param value - String to store.
 * @returns Buffer accepted by RegSetValueExW.
 */
export declare function encodeRegSz(value: string): Buffer;
/**
 * Whether `name` exists under HKCU\\Environment (value may be empty).
 * @param name - Variable name.
 * @param platform - Override for tests; defaults to `process.platform`.
 * @returns true when the value name is present.
 */
export declare function hasWindowsUserEnv(name: string, platform?: NodeJS.Platform): boolean;
/**
 * Write entries into HKCU\\Environment (no desktop-wide Environment broadcast).
 * No-op on non-Windows hosts or when `entries` is empty.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function writeWindowsUserEnv(entries: Readonly<Record<string, string>>, platform?: NodeJS.Platform): void;
/**
 * Delete many user environment values from HKCU\\Environment in one open.
 * Missing values are ignored.
 * @param names - Variable names to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function removeWindowsUserEnvs(names: readonly string[], platform?: NodeJS.Platform): void;
/**
 * Delete one user environment value from HKCU\\Environment.
 * Missing values are ignored.
 * @param name - Variable name to delete.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function removeWindowsUserEnv(name: string, platform?: NodeJS.Platform): void;
