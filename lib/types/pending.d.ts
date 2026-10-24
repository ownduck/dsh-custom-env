/** Classify env rows relative to the Host-start baseline. */
import type { EnvEntryKind } from './types.ts';
/** Result of comparing one saved value to the Host baseline. */
export interface ClassifiedEntry {
    readonly kind: EnvEntryKind;
    /** Baseline value when `kind === 'modified'`; otherwise `null`. */
    readonly previous: string | null;
}
/**
 * Classify one current `.env` entry against the Host-start baseline map.
 * @param name - variable name.
 * @param value - current saved value.
 * @param baseline - map captured when the Host plugin started.
 */
export declare function classifyEntry(name: string, value: string, baseline: Readonly<Record<string, string>>): ClassifiedEntry;
