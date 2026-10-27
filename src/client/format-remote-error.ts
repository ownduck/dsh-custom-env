/** Map Host Remote failures to settings.env locale strings. */

import type { EnvSettingsKey } from './locales.ts'

type Translate = (key: EnvSettingsKey) => string

function isRemoteFailure(value: unknown): value is { readonly code: string } {
  return typeof value === 'object'
    && value !== null
    && (value as { isDSHRemoteError?: unknown }).isDSHRemoteError === true
    && typeof (value as { code?: unknown }).code === 'string'
}

/**
 * Localize a caught Remote failure for the settings section.
 * @param error - thrown value from inject call helpers.
 * @param t - bound settings.env translator.
 */
export function formatRemoteError(error: unknown, t: Translate): string {
  if (isRemoteFailure(error)) {
    if (error.code === 'custom-env/invalid-name') return t('error.invalidName')
    if (error.code === 'custom-env/invalid-value') return t('error.invalidValue')
    if (error.code === 'custom-env/restore-failed') return t('error.restoreFailed')
    if (error.code === 'custom-env/cli-install-failed') return t('error.cliInstall')
  }
  return t('error.generic')
}
