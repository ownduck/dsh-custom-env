/** Windows: inspect / install dsh onto the user PATH via adapted command-path.ps1. */
/** State returned by the PowerShell worker. */
export interface WindowsCommandState {
    readonly fingerprint: string;
    readonly directory: string;
    readonly activeCommand?: string;
    readonly available: boolean;
    readonly managed: boolean;
}
declare class WindowsCommandError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * Resolve the packaged `scripts/command-path.ps1` next to this module's package root.
 * Works for `lib/index.js` (bundled) and source layouts.
 */
export declare function commandPathScript(fromUrl?: string): string;
/**
 * Run inspect or install against the user PATH.
 * @param operation - `inspect` or `install`.
 * @param directory - absolute directory containing `dsh.cmd`.
 * @param expected - fingerprint from a prior inspect (required for install).
 */
export declare function runWindowsCommandPath(operation: 'inspect' | 'install', directory: string, expected?: string): Promise<WindowsCommandState>;
export { WindowsCommandError };
