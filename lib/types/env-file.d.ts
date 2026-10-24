/** Line-oriented `$DSH_HOME/.env` read/write helpers. */
/** Name/value pair before Host baseline classification. */
export interface RawEnvEntry {
    readonly name: string;
    readonly value: string;
}
/**
 * Absolute path of the harness-home dotenv file.
 * @returns `$DSH_HOME/.env`.
 */
export declare function envFilePath(): string;
/**
 * Read non-empty string entries from `$DSH_HOME/.env`.
 * @returns Variable map, or `{}` when absent / empty.
 */
export declare function loadEnvMap(): Readonly<Record<string, string>>;
/**
 * List writable entries for the settings UI.
 * @returns Path, existence, and ordered entries.
 */
export declare function listEnvEntries(): {
    path: string;
    exists: boolean;
    entries: RawEnvEntry[];
};
/**
 * Upsert one key in `$DSH_HOME/.env`, creating the file when missing.
 * @param name - variable name (must be writable).
 * @param value - non-empty value.
 */
export declare function upsertEnvEntry(name: string, value: string): void;
/**
 * Remove one key from `$DSH_HOME/.env` when present.
 * @param name - variable name.
 * @returns true when a line was removed.
 */
export declare function removeEnvEntry(name: string): boolean;
