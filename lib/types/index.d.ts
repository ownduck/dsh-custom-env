/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { envFilePath } from './env-file.ts';
import { type CliStatus, type EnvSnapshot } from './types.ts';
export type { BaselineRow, CliStatus, EnvEntry, EnvSnapshot } from './types.ts';
export { classifyEntry } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        customEnv: CustomEnvController;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        'custom-env/invalid-name': {
            readonly name: string;
        };
        'custom-env/invalid-value': {
            readonly name: string;
        };
        'custom-env/cli-install-failed': {
            readonly code: string;
        };
        'custom-env/restore-failed': {
            readonly name: string;
        };
    }
}
/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */
export default class CustomEnvController extends TypertRemoteService {
    private readonly baselineById;
    private readonly idByName;
    private readonly nameById;
    private idSeq;
    constructor(ctx: Context);
    private allocId;
    private bind;
    private unbind;
    private requireName;
    /** Persist `name=value` replacing `from` in place; sync process.env / OS. */
    private commit;
    /** @returns path, existence, and file-ordered entries. */
    list(): Promise<EnvSnapshot>;
    /**
     * Create or update one row. Empty `id` creates; otherwise keeps that baseline id across renames.
     * @param id - row id, or `""` for a new row.
     * @param name - variable name.
     * @param value - non-empty value.
     */
    upsert(id: string, name: string, value: string): Promise<EnvSnapshot>;
    /** @param id - row id from list(). */
    deleteEntry(id: string): Promise<EnvSnapshot>;
    /** Restore Host-start original name+value, or delete if added after start. */
    restore(id: string): Promise<EnvSnapshot>;
    cliStatus(): Promise<CliStatus>;
    cliInstall(): Promise<CliStatus>;
}
export { envFilePath };
