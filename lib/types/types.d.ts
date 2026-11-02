/** Session types and Host-start baseline classification. */
export type EnvEntryKind = 'unchanged' | 'modified' | 'added';
/** Host-start original name and value for one row id. */
export interface BaselineRow {
    readonly name: string;
    readonly value: string;
}
/** One settings grouping for environment rows (UI / plugin metadata only). */
export interface EnvGroup {
    readonly id: string;
    readonly title: string;
}
/** One editable environment variable row. */
export interface EnvEntry {
    /** Stable row id; survives renames. */
    readonly id: string;
    readonly name: string;
    readonly value: string;
    /** Group id from the groups sidecar; defaults to `default`. */
    readonly groupId: string;
    readonly kind: EnvEntryKind;
    /** Host-start original value when `kind === 'modified'`; otherwise `null`. */
    readonly previous: string | null;
}
/** Snapshot returned by `customEnv/list`. */
export interface EnvSnapshot {
    readonly path: string;
    readonly exists: boolean;
    readonly groups: readonly EnvGroup[];
    readonly entries: readonly EnvEntry[];
}
/** One name/value pair for plugin-facing `setVar` / `setVars`. */
export interface EnvVarWrite {
    readonly name: string;
    readonly value: string;
    /**
     * Target group id.
     * When set, membership is assigned to that group.
     * When omitted, new names use `default` and existing names keep their group.
     */
    readonly group?: string;
}
/** Options for `customEnv/deleteGroup`. */
export interface DeleteGroupOptions {
    /**
     * When true, move member rows into the default group.
     * When false, delete those variables from `.env` as well.
     */
    readonly moveToDefault: boolean;
}
/** Snapshot returned by `customEnv/cliStatus` and `cliInstall`. */
export interface CliStatus {
    readonly platform: string;
    readonly activePath: string | null;
    readonly expectedPath: string | null;
    readonly expectedDirectory: string | null;
    readonly matches: boolean;
    readonly canInstall: boolean;
    readonly reason: string | null;
}
/**
 * Classify one row against the Host-start baseline by stable id.
 * @param id - row id.
 * @param name - current file name.
 * @param value - current file value.
 * @param baselineById - Host-start originals.
 */
export declare function classifyEntry(id: string, name: string, value: string, baselineById: ReadonlyMap<string, BaselineRow>): {
    readonly kind: EnvEntryKind;
    readonly previous: string | null;
};
