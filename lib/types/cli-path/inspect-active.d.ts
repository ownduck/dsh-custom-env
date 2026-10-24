/** Locate the first `dsh` visible on the user + machine PATH. */
declare const MAC_DESTINATION = "/usr/local/bin/dsh";
/** Result of scanning PATH for an active dsh command. */
export interface ActiveCli {
    /** Absolute path of the first matching launcher, if any. */
    readonly path: string | undefined;
    /** When `path` is a symlink, its resolved target (macOS / POSIX). */
    readonly symlinkTarget: string | undefined;
}
/** Inputs for tests. */
export interface InspectActiveOptions {
    readonly platform?: NodeJS.Platform;
    readonly pathEnv?: string | undefined;
    readonly machinePath?: string | undefined;
    readonly pathext?: string | undefined;
    readonly exists?: (path: string) => boolean;
    readonly isExecutable?: (path: string) => boolean;
    readonly readLink?: (path: string) => string | undefined;
}
/**
 * Find the first `dsh` on PATH (machine then user on Windows).
 * @param options - optional env overrides for tests.
 */
export declare function inspectActiveCli(options?: InspectActiveOptions): ActiveCli;
/**
 * Whether the active CLI matches the expected launcher.
 * On macOS, prefer symlink target comparison when active is `/usr/local/bin/dsh`.
 * @param active - PATH scan result.
 * @param expectedLauncher - expected absolute launcher.
 * @param platform - override for tests.
 */
export declare function activeMatchesExpected(active: ActiveCli, expectedLauncher: string, platform?: NodeJS.Platform): boolean;
export { MAC_DESTINATION };
