/** Line-oriented `$DSH_HOME/.env` read/write helpers. */
/** Name/value pair before Host baseline classification. */
export interface RawEnvEntry {
    readonly name: string;
    readonly value: string;
}
/** Absolute path of `$DSH_HOME/.env`. */
export declare function envFilePath(): string;
/**
 * Read writable entries from `$DSH_HOME/.env` (empty values included).
 * @returns Variable map, or `{}` when absent / empty.
 */
export declare function loadEnvMap(): Readonly<Record<string, string>>;
/**
 * List writable entries in `.env` file order (new keys stay at the end).
 * @returns Path, existence, and ordered entries.
 */
export declare function listEnvEntries(): {
    path: string;
    exists: boolean;
    entries: RawEnvEntry[];
};
/**
 * Write `name=value` in place of `replaceName` (keeps order), or append when missing.
 * Use the same name for both to update; different names to rename in place.
 * @param replaceName - line to replace.
 * @param name - name to store.
 * @param value - value to store (empty string writes `NAME=`).
 */
export declare function writeEnvEntry(replaceName: string, name: string, value: string): void;
/** Create or replace one key (append when new). */
export declare function upsertEnvEntry(name: string, value: string): void;
/** Rename one key in place (keeps file order). */
export declare function renameEnvEntry(from: string, to: string, value: string): void;
/**
 * Remove one key from `$DSH_HOME/.env` when present.
 * @param name - variable name.
 * @returns true when a line was removed.
 */
export declare function removeEnvEntry(name: string): boolean;
