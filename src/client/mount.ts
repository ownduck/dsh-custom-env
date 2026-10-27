/** Mount Remote contribution and the settings.section page. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { EnvSettingsSection } from './EnvSettingsSection.tsx'
import { en, NS, zh } from './locales.ts'

export const inject = ['remote', 'slots', 'locale'] as const

function registerUi(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'custom-env: dictionaries')
  const t = ctx.locale.bind(NS)
  const call = async <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): Promise<T> => {
    if (!result.ok) throw result.error
    return result.value
  }
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'env',
    order: 25,
    label: () => t('panel.nav'),
    locale: NS,
    inject: () => ({
      load: async () => call(await ctx.remote.customEnv.list()),
      upsert: async (id: string, name: string, value: string) => call(await ctx.remote.customEnv.upsert(id, name, value)),
      remove: async (id: string) => call(await ctx.remote.customEnv.deleteEntry(id)),
      restore: async (id: string) => call(await ctx.remote.customEnv.restore(id)),
      cliStatus: async () => call(await ctx.remote.customEnv.cliStatus()),
      cliInstall: async () => call(await ctx.remote.customEnv.cliInstall()),
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
