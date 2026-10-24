/** CLI PATH status and install entry points for the Host remote. */

import { inspectActiveCli } from './inspect-active.ts'
import { installMacosCliLink, MacosCommandError, readMacosCliLink } from './macos.ts'
import { resolveExpectedCli } from './resolve-expected.ts'
import { buildCliStatus, type CliStatus } from './status.ts'
import { runWindowsCommandPath, WindowsCommandError } from './windows.ts'

export type { CliStatus } from './status.ts'

/**
 * Report whether the user-environment `dsh` matches this Host's expected launcher.
 */
export async function cliStatus(): Promise<CliStatus> {
  const platform = process.platform
  const expected = resolveExpectedCli({ platform })
  if (platform === 'win32' && expected !== undefined) {
    try {
      const state = await runWindowsCommandPath('inspect', expected.directory)
      return buildCliStatus({
        platform,
        expected,
        active: { path: state.activeCommand, symlinkTarget: undefined },
      })
    } catch {
      // Fall through to process PATH scan when PowerShell inspect fails.
    }
  }
  if (platform === 'darwin' && expected !== undefined) {
    const link = readMacosCliLink()
    const active = inspectActiveCli({ platform })
    const path = active.path ?? (link !== undefined ? '/usr/local/bin/dsh' : undefined)
    return buildCliStatus({
      platform,
      expected,
      active: {
        path,
        symlinkTarget: link ?? active.symlinkTarget,
      },
    })
  }
  return buildCliStatus({ platform, expected })
}

/**
 * Install the expected CLI into the user environment (Windows PATH / macOS symlink).
 * @returns refreshed status after install.
 */
export async function cliInstall(): Promise<CliStatus> {
  const before = await cliStatus()
  if (!before.canInstall || before.expectedPath === null || before.expectedDirectory === null) {
    const error = new Error(before.reason ?? 'CLI install is not available')
    ;(error as NodeJS.ErrnoException).code = 'EUNSUPPORTED'
    throw error
  }
  const platform = before.platform
  try {
    if (platform === 'win32') {
      const inspect = await runWindowsCommandPath('inspect', before.expectedDirectory)
      await runWindowsCommandPath('install', before.expectedDirectory, inspect.fingerprint)
    } else if (platform === 'darwin') {
      await installMacosCliLink(before.expectedPath)
    } else {
      throw new Error('CLI install is not supported on this platform')
    }
  } catch (error) {
    if (error instanceof WindowsCommandError || error instanceof MacosCommandError) throw error
    throw error
  }
  return cliStatus()
}
