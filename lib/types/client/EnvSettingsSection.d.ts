/** Settings section: `$DSH_HOME/.env` editor + global `dsh` path. */
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { CliStatus, EnvSnapshot } from '../types.ts';
import type { EnvSettingsKey } from './locales.ts';
export interface EnvSettingsInjected {
    readonly load: () => Promise<EnvSnapshot>;
    /** Create (`id === ""`) or update/rename one row by stable id. */
    readonly upsert: (id: string, name: string, value: string) => Promise<EnvSnapshot>;
    readonly remove: (id: string) => Promise<EnvSnapshot>;
    readonly restore: (id: string) => Promise<EnvSnapshot>;
    readonly cliStatus: () => Promise<CliStatus>;
    readonly cliInstall: () => Promise<CliStatus>;
}
export type EnvSettingsSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'settings.env'> & InjectFace<EnvSettingsInjected>;
/**
 * Render the environment settings page.
 * @param props - locale `t` and Host remote callbacks.
 */
export declare function EnvSettingsSection({ t, load, upsert, remove, restore, cliStatus, cliInstall, }: EnvSettingsSectionProps): any;
export type { EnvSettingsKey };
