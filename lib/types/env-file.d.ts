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
export declare function readEnvMap(): Readonly<Record<string, string>>;
/**
 * List writable entries in `.env` file order (new keys stay at the end).
 * @returns Path, existence, and ordered entries.
 */
export declare function listEnvEntries(): {
    path: string;
    exists: boolean;
    entries: RawEnvEntry[];
};
/** Options for empty-value write policy. */
export interface WriteEnvOptions {
    /**
     * When true, empty values always create/replace.
     * When false (default), empty values only create a missing key; existing keys
     * in `$DSH_HOME/.env` or the OS user environment are left unchanged.
     */
    readonly forceEmpty?: boolean;
}
/**
 * Whether `name` already exists in `$DSH_HOME/.env` or the OS user environment.
 * Presence counts even when the current value is empty.
 * @param name - Variable name.
 * @returns true when a same-named entry is already present.
 */
export declare function hasEnvKey(name: string): boolean;
/**
 * Drop empty writes that would clobber an existing key (unless `forceEmpty`).
 * Non-empty values always pass; last duplicate name wins.
 * @param entries - Candidate writes.
 * @param options - Empty-value policy.
 * @returns Entries that should be applied.
 */
export declare function selectEnvWrites(entries: readonly {
    readonly name: string;
    readonly value: string;
}[], options?: WriteEnvOptions): RawEnvEntry[];
/**
 * Create or replace many keys in one file rewrite (last duplicate name wins).
 * Existing keys keep file order; new keys append in input order.
 * Empty values write `NAME=` only when the key is absent (unless `forceEmpty`).
 * @param entries - name/value pairs.
 * @param options - Empty-value policy.
 * @returns Entries actually written (may be empty when all empty writes were skipped).
 */
export declare function writeEnvEntries(entries: readonly {
    readonly name: string;
    readonly value: string;
}[], options?: WriteEnvOptions): RawEnvEntry[];
/**
 * Create or replace one key (append when new). Honors empty-skip unless `forceEmpty`.
 * @param name - Variable name.
 * @param value - Value to store.
 * @param options - Empty-value policy.
 * @returns true when the file was rewritten.
 */
export declare function writeEnvEntry(name: string, value: string, options?: WriteEnvOptions): boolean;
/**
 * Rename one key in place (keeps file order) and always write `value`.
 * @param from - Existing name.
 * @param to - New name.
 * @param value - Value to store.
 */
export declare function renameEnvEntry(from: string, to: string, value: string): void;
/**
 * Remove many keys from `$DSH_HOME/.env` in one rewrite.
 * @param names - variable names (all must be writable).
 * @returns number of assignment lines removed.
 */
export declare function removeEnvEntries(names: readonly string[]): number;
/**
 * Remove one key from `$DSH_HOME/.env` when present.
 * @param name - variable name.
 * @returns true when a line was removed.
 */
export declare function removeEnvEntry(name: string): boolean;
