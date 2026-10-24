/** Browser entry for `$DSH_HOME/.env` settings. */

import type { Context } from '@deepseek-ai/cordis'
import remote from '../../lib/typert.remote-client.js'
import { mountCustomEnv } from './mount.ts'

export { inject } from './mount.ts'
export type { EnvSettingsKey } from './locales.ts'
export type { EnvSettingsInjected, EnvSettingsSectionProps } from './EnvSettingsSection.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Environment variables settings copy. */
    'settings.env': import('./locales.ts').EnvSettingsKey
  }
}

/**
 * Mount the environment settings page and its Remote methods.
 * @param ctx - browser plugin context.
 * @returns disposer joining UI and Remote withdrawal.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  return await mountCustomEnv(ctx, remote)
}
