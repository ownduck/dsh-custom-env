/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { envFilePath } from './env-file.ts';
import { type CliStatus, type EnvSnapshot, type EnvVarWrite } from './types.ts';
export type { BaselineRow, CliStatus, EnvEntry, EnvSnapshot, EnvVarWrite } from './types.ts';
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
    /** Persist `name=value` replacing `from` in place; sync process.env / OS. Empty values allowed. */
    private commit;
    /** @returns path, existence, and file-ordered entries. */
    list(): Promise<EnvSnapshot>;
    /**
     * Create or update one row. Empty `id` creates; otherwise keeps that baseline id across renames.
     * @param id - row id, or `""` for a new row.
     * @param name - variable name.
     * @param value - value (empty string allowed; Settings UI may still reject empty drafts).
     */
    upsert(id: string, name: string, value: string): Promise<EnvSnapshot>;
    /**
     * Create or replace many variables by name (plugin-facing; empty values allowed).
     * One file rewrite; last duplicate name wins. Invalid names reject the whole batch.
     * @param entries - name/value pairs.
     */
    setVars(entries: readonly EnvVarWrite[]): Promise<void>;
    /**
     * Create or replace one variable by name (plugin-facing; empty value allowed).
     * @param name - writable variable name.
     * @param value - value to store (`""` writes `NAME=` and sets `process.env[name]` to `""`).
     */
    setVar(name: string, value: string): Promise<void>;
    /**
     * Remove many variables by name (plugin-facing).
     * @param names - writable variable names.
     * @returns number of `.env` lines removed.
     */
    removeVars(names: readonly string[]): Promise<number>;
    /**
     * Remove one variable by name (plugin-facing).
     * @param name - writable variable name.
     * @returns true when a `.env` line was removed.
     */
    removeVar(name: string): Promise<boolean>;
    /** @param id - row id from list(). */
    deleteEntry(id: string): Promise<EnvSnapshot>;
    /** Restore Host-start original name+value, or delete if added after start. */
    restore(id: string): Promise<EnvSnapshot>;
    cliStatus(): Promise<CliStatus>;
    cliInstall(): Promise<CliStatus>;
}
export { envFilePath };
