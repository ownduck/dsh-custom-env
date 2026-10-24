/** Compose CLI PATH status for the settings UI. */

import { activeMatchesExpected, inspectActiveCli, type ActiveCli } from './inspect-active.ts'
import { resolveExpectedCli, type ExpectedCli } from './resolve-expected.ts'

/** Snapshot returned by `customEnv/cliStatus` and `cliInstall`. */
export interface CliStatus {
  /** Host platform. */
  readonly platform: NodeJS.Platform
  /** First `dsh` found on the user environment PATH, if any. */
  readonly activePath: string | null
  /** Expected launcher for this Host, if resolved. */
  readonly expectedPath: string | null
  /** Expected bin directory (Windows PATH entry). */
  readonly expectedDirectory: string | null
  /** Whether active matches expected. */
  readonly matches: boolean
  /** Whether the Install button should be shown. */
  readonly canInstall: boolean
  /** Why install is unavailable or paths could not be resolved. */
  readonly reason: string | null
}

/** Optional overrides for tests / Windows registry inspect. */
export interface BuildCliStatusOptions {
  readonly platform?: NodeJS.Platform
  readonly expected?: ExpectedCli | undefined
  readonly active?: ActiveCli
  readonly resolveFailedReason?: string
}

/**
 * Build a status object from expected + active probes.
 * @param options - optional overrides.
 */
export function buildCliStatus(options: BuildCliStatusOptions = {}): CliStatus {
  const platform = options.platform ?? process.platform
  const expected = options.expected !== undefined ? options.expected : resolveExpectedCli({ platform })
  const active = options.active ?? inspectActiveCli({ platform })

  if (expected === undefined) {
    return {
      platform,
      activePath: active.path ?? null,
      expectedPath: null,
      expectedDirectory: null,
      matches: false,
      canInstall: false,
      reason: options.resolveFailedReason ?? 'could-not-resolve-expected-cli',
    }
  }

  const matches = activeMatchesExpected(active, expected.launcher, platform)
  const canInstall = !matches && (platform === 'win32' || platform === 'darwin')
  return {
    platform,
    activePath: active.path ?? null,
    expectedPath: expected.launcher,
    expectedDirectory: expected.directory,
    matches,
    canInstall,
    reason: matches ? null
      : platform !== 'win32' && platform !== 'darwin' ? 'unsupported-platform'
        : null,
  }
}
