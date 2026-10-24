/** Compose CLI PATH status for the settings UI. */
import { type ActiveCli } from './inspect-active.ts';
import { type ExpectedCli } from './resolve-expected.ts';
/** Snapshot returned by `customEnv/cliStatus` and `cliInstall`. */
export interface CliStatus {
    /** Host platform. */
    readonly platform: NodeJS.Platform;
    /** First `dsh` found on the user environment PATH, if any. */
    readonly activePath: string | null;
    /** Expected launcher for this Host, if resolved. */
    readonly expectedPath: string | null;
    /** Expected bin directory (Windows PATH entry). */
    readonly expectedDirectory: string | null;
    /** Whether active matches expected. */
    readonly matches: boolean;
    /** Whether the Install button should be shown. */
    readonly canInstall: boolean;
    /** Why install is unavailable or paths could not be resolved. */
    readonly reason: string | null;
}
/** Optional overrides for tests / Windows registry inspect. */
export interface BuildCliStatusOptions {
    readonly platform?: NodeJS.Platform;
    readonly expected?: ExpectedCli | undefined;
    readonly active?: ActiveCli;
    readonly resolveFailedReason?: string;
}
/**
 * Build a status object from expected + active probes.
 * @param options - optional overrides.
 */
export declare function buildCliStatus(options?: BuildCliStatusOptions): CliStatus;
