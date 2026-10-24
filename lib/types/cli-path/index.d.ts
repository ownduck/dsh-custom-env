/** CLI PATH status and install entry points for the Host remote. */
import { type CliStatus } from './status.ts';
export type { CliStatus } from './status.ts';
/**
 * Report whether the user-environment `dsh` matches this Host's expected launcher.
 */
export declare function cliStatus(): Promise<CliStatus>;
/**
 * Install the expected CLI into the user environment (Windows PATH / macOS symlink).
 * @returns refreshed status after install.
 */
export declare function cliInstall(): Promise<CliStatus>;
