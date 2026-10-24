/** Mount Remote contribution and the settings.section page. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { EnvSettingsSection } from './EnvSettingsSection.tsx'
import { en, NS, zh } from './locales.ts'

/** Services required to mount the optional Remote and settings page. */
export const inject = ['remote', 'slots', 'locale'] as const

/**
 * Register locale dictionaries and the Environment settings section.
 * @param ctx - browser context that already has `remote.customEnv`.
 */
function registerUi(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'custom-env: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'env',
    order: 25,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({
      load: async () => {
        const result = await ctx.remote.customEnv.list()
        if (!result.ok) throw result.error
        return result.value
      },
      upsert: async (name: string, value: string) => {
        const result = await ctx.remote.customEnv.upsert(name, value)
        if (!result.ok) throw result.error
        return result.value
      },
      remove: async (name: string) => {
        const result = await ctx.remote.customEnv.remove(name)
        if (!result.ok) throw result.error
        return result.value
      },
      cliStatus: async () => {
        const result = await ctx.remote.customEnv.cliStatus()
        if (!result.ok) throw result.error
        return result.value
      },
      cliInstall: async () => {
        const result = await ctx.remote.customEnv.cliInstall()
        if (!result.ok) throw result.error
        return result.value
      },
    }),
  }, EnvSettingsSection))
}

/**
 * Mount the custom-env Remote and settings UI.
 * @param ctx - Client plugin lifetime.
 * @param contribution - generated controller Remote definitions.
 * @returns disposer that removes both contributions.
 */
export async function mountCustomEnv(
  ctx: Context,
  contribution: TypertRemoteContribution,
): Promise<() => Promise<void>> {
  const unmountRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['remote.customEnv', 'slots', 'locale'], child => registerUi(child))
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await unmountRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await unmountRemote()
  }
}
