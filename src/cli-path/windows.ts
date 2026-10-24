/** Windows: inspect / install dsh onto the user PATH via adapted command-path.ps1. */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** State returned by the PowerShell worker. */
export interface WindowsCommandState {
  readonly fingerprint: string
  readonly directory: string
  readonly activeCommand?: string
  readonly available: boolean
  readonly managed: boolean
}

class WindowsCommandError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'WindowsCommandError'
  }
}

/**
 * Resolve the packaged `scripts/command-path.ps1` next to this module's package root.
 * Works for `lib/index.js` (bundled) and source layouts.
 */
export function commandPathScript(fromUrl: string = import.meta.url): string {
  const here = dirname(fileURLToPath(fromUrl))
  // Bundled `lib/index.js` → `../scripts`; source `src/cli-path/` → `../../scripts`.
  const candidates = [
    join(here, '..', 'scripts', 'command-path.ps1'),
    join(here, '..', '..', 'scripts', 'command-path.ps1'),
    join(here, 'scripts', 'command-path.ps1'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return candidates[0]!
}

/**
 * Run inspect or install against the user PATH.
 * @param operation - `inspect` or `install`.
 * @param directory - absolute directory containing `dsh.cmd`.
 * @param expected - fingerprint from a prior inspect (required for install).
 */
export async function runWindowsCommandPath(
  operation: 'inspect' | 'install',
  directory: string,
  expected?: string,
): Promise<WindowsCommandState> {
  if (process.platform !== 'win32') {
    throw new WindowsCommandError('EUNSUPPORTED', 'Windows command PATH install is only available on win32.')
  }
  const systemRoot = process.env.SystemRoot ?? process.env.WINDIR
  if (systemRoot === undefined) {
    throw new WindowsCommandError('ENOENT', 'Windows system directory is unavailable.')
  }
  const shell = join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  const script = commandPathScript()
  const child = spawn(
    shell,
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true },
  )
  const chunks: Buffer[] = []
  const errChunks: Buffer[] = []
  child.stdout.on('data', (chunk: Buffer) => { chunks.push(chunk) })
  child.stderr.on('data', (chunk: Buffer) => { errChunks.push(chunk) })
  const exited = new Promise<number | null>((accept, reject) => {
    child.once('error', reject)
    child.once('close', accept)
  })
  child.stdin.end(JSON.stringify({
    operation,
    directory,
    ...expected === undefined ? {} : { expected },
  }))
  const code = await exited
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  let parsed: { ok?: boolean; code?: string; message?: string; state?: Record<string, unknown> }
  try {
    parsed = JSON.parse(raw) as typeof parsed
  } catch (error) {
    const detail = Buffer.concat(errChunks).toString('utf8').trim() || raw
    throw new WindowsCommandError(
      'EIO',
      `command-path.ps1 returned invalid JSON (exit ${String(code)})${detail === '' ? '' : `: ${detail}`}`,
    )
  }
  if (parsed.ok !== true || parsed.state === undefined) {
    throw new WindowsCommandError(
      typeof parsed.code === 'string' ? parsed.code : 'EIO',
      typeof parsed.message === 'string' ? parsed.message : 'command-path.ps1 failed',
    )
  }
  const state = parsed.state
  if (typeof state.fingerprint !== 'string' || typeof state.directory !== 'string'
    || typeof state.available !== 'boolean' || typeof state.managed !== 'boolean') {
    throw new WindowsCommandError('EIO', 'command-path.ps1 returned an incomplete state.')
  }
  return {
    fingerprint: state.fingerprint,
    directory: state.directory,
    available: state.available,
    managed: state.managed,
    ...typeof state.activeCommand === 'string' ? { activeCommand: state.activeCommand } : {},
  }
}

export { WindowsCommandError }
