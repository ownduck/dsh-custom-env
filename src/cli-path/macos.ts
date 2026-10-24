/** macOS: install `/usr/local/bin/dsh` → expected launcher (may conflict with Desktop). */

import { execFile } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, renameSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Fixed public command path used by Desktop and this plugin. */
export const MAC_CLI_DESTINATION = '/usr/local/bin/dsh'

/** Receipt owned by this plugin (never `.dsh-desktop-command.json`). */
export const MAC_CLI_RECEIPT = '/usr/local/bin/.dsh-custom-env-command.json'

class MacosCommandError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'MacosCommandError'
  }
}

interface Receipt {
  readonly schemaVersion: 1
  readonly launcher: string
}

/**
 * Read the current symlink target at the public destination, if any.
 * @param destination - absolute path (default `/usr/local/bin/dsh`).
 */
export function readMacosCliLink(destination: string = MAC_CLI_DESTINATION): string | undefined {
  try {
    if (!lstatSync(destination).isSymbolicLink()) return undefined
    const target = readlinkSync(destination)
    return isAbsolute(target) ? target : join(dirname(destination), target)
  } catch {
    return undefined
  }
}

/**
 * Install or repair the `/usr/local/bin/dsh` symlink to `launcher`.
 * Elevates with osascript when the first attempt hits EACCES.
 * @param launcher - absolute path of the expected `dsh` script.
 */
export async function installMacosCliLink(launcher: string): Promise<void> {
  if (process.platform !== 'darwin') {
    throw new MacosCommandError('EUNSUPPORTED', 'macOS command install is only available on darwin.')
  }
  if (!isAbsolute(launcher) || !existsSync(launcher)) {
    throw new MacosCommandError('ENOENT', 'The expected launcher is unavailable.')
  }
  const current = readMacosCliLink()
  if (current !== undefined && same(current, launcher)) {
    writeReceipt(launcher)
    return
  }
  try {
    await writeLink(launcher)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EACCES') throw error
    await writeLinkElevated(launcher)
  }
  writeReceipt(launcher)
}

async function writeLink(launcher: string): Promise<void> {
  mkdirSync(dirname(MAC_CLI_DESTINATION), { recursive: true })
  const pending = `${MAC_CLI_DESTINATION}.dsh-custom-env-new`
  try { unlinkSync(pending) } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  symlinkSync(launcher, pending)
  try {
    try { unlinkSync(MAC_CLI_DESTINATION) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    renameSync(pending, MAC_CLI_DESTINATION)
  } catch (error) {
    try { unlinkSync(pending) } catch (cleanup) {
      if ((cleanup as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new AggregateError([error, cleanup], 'Failed to install macOS dsh link')
      }
    }
    throw error
  }
}

async function writeLinkElevated(launcher: string): Promise<void> {
  // AppleScript elevates a short shell that recreates the symlink.
  const escapedLauncher = launcher.replace(/'/gu, `'\\''`)
  const escapedDest = MAC_CLI_DESTINATION.replace(/'/gu, `'\\''`)
  const shell = `mkdir -p /usr/local/bin && ln -sfn '${escapedLauncher}' '${escapedDest}'`
  const script = `do shell script ${JSON.stringify(shell)} with administrator privileges`
  try {
    await execFileAsync('/usr/bin/osascript', ['-e', script])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new MacosCommandError('EACCES', `Elevated symlink failed: ${message}`)
  }
}

function writeReceipt(launcher: string): void {
  const receipt: Receipt = { schemaVersion: 1, launcher }
  try {
    writeFileSync(MAC_CLI_RECEIPT, `${JSON.stringify(receipt)}\n`, { mode: 0o644 })
  } catch (error) {
    // Receipt is best-effort metadata; the symlink is the user-visible install.
    if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
      try {
        const existing = readFileSync(MAC_CLI_RECEIPT, 'utf8')
        if (existing.includes(launcher)) return
      } catch {
        // ignore
      }
    }
  }
}

function same(left: string, right: string): boolean {
  return left === right
}

export { MacosCommandError }
