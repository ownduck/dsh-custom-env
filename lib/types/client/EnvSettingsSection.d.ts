/** Settings section: list / upsert / remove `$DSH_HOME/.env` entries. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { EnvSnapshot } from '../types.ts';
import type { EnvSettingsKey } from './locales.ts';
/** Callbacks injected from the Client apply closure. */
export interface EnvSettingsInjected {
    /** Load the current snapshot from the Host. */
    readonly load: () => Promise<EnvSnapshot>;
    /** Create or replace one entry. */
    readonly upsert: (name: string, value: string) => Promise<EnvSnapshot>;
    /** Delete one entry. */
    readonly remove: (name: string) => Promise<EnvSnapshot>;
}
/** Props bound by the slot renderer. */
export type EnvSettingsSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.env'> & InjectFace<EnvSettingsInjected>;
/**
 * Render the environment-variables settings page.
 * @param props - locale `t` and Host remote callbacks.
 */
export declare function EnvSettingsSection({ t, load, upsert, remove }: EnvSettingsSectionProps): import("react").JSX.Element;
export type { EnvSettingsKey };
//# sourceMappingURL=EnvSettingsSection.d.ts.map