/** Parse clipboard text into environment name/value pairs for Settings paste. */
/** One parsed assignment from a paste. */
export interface ParsedEnvPair {
    readonly name: string;
    readonly value: string;
}
/**
 * Parse multiline `NAME=VALUE` paste text into pairs.
 * Trims lines and spaces around `=`; splits on the first `=`; skips blanks and invalid names.
 * Duplicate names in one paste keep the last value.
 * @param text - Clipboard text.
 * @returns Ordered unique pairs (last duplicate wins).
 */
export declare function parseEnvPaste(text: string): ParsedEnvPair[];
/**
 * Format pairs for clipboard copy (one `NAME=VALUE` per line).
 * Skips empty names. Does not trim values beyond what the caller provides.
 * @param pairs - Ordered name/value pairs.
 * @returns Clipboard text; empty string when no usable pairs.
 */
export declare function formatEnvCopy(pairs: readonly ParsedEnvPair[]): string;
