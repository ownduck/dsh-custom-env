/**
 * Persist or delete variables in the Windows user environment (HKCU\\Environment)
 * via koffi + advapi32/user32 — same approach as the former in-tree custom-env.
 */
/** Win32 registry and broadcast calls used to publish user environment values. */
export interface WindowsUserEnvBindings {
    readonly openKey: (hKey: number, subKey: string, options: number, samDesired: number, result: [unknown]) => number;
    readonly setValue: (hKey: unknown, valueName: string, reserved: number, type: number, data: Buffer, cbData: number) => number;
    readonly deleteValue: (hKey: unknown, valueName: string) => number;
    readonly closeKey: (hKey: unknown) => number;
    readonly sendMessageTimeout: (hWnd: number, msg: number, wParam: number, lParam: string, flags: number, timeoutMs: number, result: [number]) => number;
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
 * Write entries into HKCU\\Environment and broadcast WM_SETTINGCHANGE.
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
