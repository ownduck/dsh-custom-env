/** Map Host Remote failures to settings.env locale strings. */
import type { EnvSettingsKey } from './locales.ts';
type Translate = (key: EnvSettingsKey) => string;
/**
 * Localize a caught Remote failure for the settings section.
 * @param error - thrown value from inject call helpers.
 * @param t - bound settings.env translator.
 */
export declare function formatRemoteError(error: unknown, t: Translate): string;
export {};
