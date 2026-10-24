/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { envFilePath } from './env-file.ts';
import type { CliStatus, EnvSnapshot } from './types.ts';
export type { CliStatus, EnvEntry, EnvSnapshot } from './types.ts';
export { classifyEntry } from './pending.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** `$DSH_HOME/.env` management remote. */
        customEnv: CustomEnvController;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        /** Name refused by bootstrap rules or dotenv syntax. */
        'custom-env/invalid-name': {
            readonly name: string;
        };
        /** Empty value rejected on upsert. */
        'custom-env/invalid-value': {
            readonly name: string;
        };
        /** CLI PATH / symlink install failed. */
        'custom-env/cli-install-failed': {
            readonly code: string;
        };
        /** Restore refused (not a modified baseline entry). */
        'custom-env/restore-failed': {
            readonly name: string;
        };
    }
}
/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */
export default class CustomEnvController extends TypertRemoteService {
    /** `.env` map captured when this Host plugin started. */
    private readonly baseline;
    constructor(ctx: Context);
    /**
     * List current `$DSH_HOME/.env` entries with pending classification.
     * @returns path, existence, and sorted entries.
     */
    list(): Promise<EnvSnapshot>;
    /**
     * Create or replace one entry, syncing Host and OS user environment.
     * @param name - writable variable name.
     * @param value - non-empty value.
     * @returns updated snapshot.
     */
    upsert(name: string, value: string): Promise<EnvSnapshot>;
    /**
     * Delete one entry from the file, Host, and OS user environment.
     * @param name - writable variable name.
     * @returns updated snapshot.
     */
    deleteEntry(name: string): Promise<EnvSnapshot>;
    /**
     * Write a modified entry back to its Host-start baseline value.
     * @param name - variable that exists in the baseline and differs from it.
     * @returns updated snapshot.
     */
    restore(name: string): Promise<EnvSnapshot>;
    /**
     * Compare the user-environment `dsh` with the launcher expected for this Host.
     * @returns active path, expected path, and whether Install should be offered.
     */
    cliStatus(): Promise<CliStatus>;
    /**
     * Install the expected CLI onto the Windows user PATH or as `/usr/local/bin/dsh` on macOS.
     * @returns refreshed status after install.
     */
    cliInstall(): Promise<CliStatus>;
}
/** Re-export path helper for tests. */
export { envFilePath };
