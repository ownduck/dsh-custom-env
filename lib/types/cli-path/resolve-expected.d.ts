/** Infer the CLI launcher this Host process should expose on PATH. */
/** Resolved expected CLI locations, or a reason when resolution fails. */
export interface ExpectedCli {
    /** Absolute path of the launcher file (`dsh` / `dsh.cmd`). */
    readonly launcher: string;
    /** Directory that should appear on PATH (Windows) or be the symlink target's directory. */
    readonly directory: string;
    /** How the expectation was derived. */
    readonly kind: 'electron-resources' | 'argv' | 'walk';
}
/** Inputs for tests; defaults to the live process. */
export interface ResolveExpectedOptions {
    readonly platform?: NodeJS.Platform;
    readonly execPath?: string;
    readonly argv?: readonly string[];
    readonly electronRunAsNode?: string | undefined;
    readonly exists?: (path: string) => boolean;
}
/**
 * Infer the expected dsh launcher from how this Host was started.
 * @param options - optional process overrides for tests.
 * @returns expected locations, or `undefined` when unknown.
 */
export declare function resolveExpectedCli(options?: ResolveExpectedOptions): ExpectedCli | undefined;
