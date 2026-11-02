/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { envFilePath } from './env-file.ts';
import { type CliStatus, type DeleteGroupOptions, type EnvGroup, type EnvSnapshot, type EnvVarWrite } from './types.ts';
export type { BaselineRow, CliStatus, DeleteGroupOptions, EnvEntry, EnvGroup, EnvSnapshot, EnvVarWrite, } from './types.ts';
export { classifyEntry } from './types.ts';
export { DEFAULT_GROUP_ID, DEFAULT_GROUP_TITLE } from './group-ids.ts';
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
        'custom-env/invalid-group': {
            readonly group: string;
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
    private loadGroups;
    private saveGroups;
    private requireGroup;
    /**
     * Write `name=value` replacing `from` in place; sync process.env / OS.
     * Empty values create missing keys only, unless `forceEmpty` (restore).
     */
    private commit;
    /** @returns path, existence, groups, and file-ordered entries. */
    list(): Promise<EnvSnapshot>;
    /**
     * Create or update one row. Empty `id` creates; otherwise keeps that baseline id across renames.
     * @param id - row id, or `""` for a new row.
     * @param name - variable name.
     * @param value - value (empty creates only when missing; Settings UI may still reject empty drafts).
     * @param groupId - required for create semantics (`id === ""`, defaults to `default`);
     *   on update, omit to keep membership, or pass to reassign (same as `moveEntry`).
     */
    upsert(id: string, name: string, value: string, groupId?: string): Promise<EnvSnapshot>;
    /**
     * Create or replace many variables by name (plugin-facing).
     * Non-empty values always write; empty values create missing keys only and do not
     * clear existing `$DSH_HOME/.env` or OS user values. One file rewrite; last
     * duplicate name wins. Invalid names reject the whole batch.
     * @param entries - name/value pairs; optional `group` assigns membership when set.
     *   Omitted `group`: new names → `default`; existing names keep their group.
     */
    setVars(entries: readonly EnvVarWrite[]): Promise<void>;
    /**
     * Create or replace one variable by name (plugin-facing).
     * @param name - writable variable name.
     * @param value - non-empty always stores; `""` writes `NAME=` only when the key is absent.
     * @param group - optional group id; when omitted, new names use `default` and existing keep theirs.
     */
    setVar(name: string, value: string, group?: string): Promise<void>;
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
    /**
     * Create a custom group.
     * @param title - Non-empty display title.
     */
    createGroup(title: string): Promise<EnvGroup>;
    /**
     * Rename a custom group (not the default group).
     * @param id - Group id.
     * @param title - New title.
     */
    renameGroup(id: string, title: string): Promise<EnvGroup>;
    /**
     * Delete a custom group.
     * @param id - Group id (not `default`).
     * @param options - When `moveToDefault` is false, member variables are removed from `.env`.
     */
    deleteGroup(id: string, options: DeleteGroupOptions): Promise<EnvSnapshot>;
    /**
     * Move one row into another group.
     * @param id - Row id.
     * @param groupId - Target group id.
     */
    moveEntry(id: string, groupId: string): Promise<EnvSnapshot>;
    cliStatus(): Promise<CliStatus>;
    cliInstall(): Promise<CliStatus>;
}
export { envFilePath };
