/**
 * Spawn a child to persist OS user env without blocking the Host.
 * Sets `ELECTRON_RUN_AS_NODE` so Desktop's Electron binary runs the script as Node.
 */

import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Start a child that writes `entries` into the OS user environment.
 * @param entries - Variable map to persist.
 * @returns The child process, or `undefined` when the bundled script is missing.
 */
export function startWriteUserEnvChild(
  entries: Readonly<Record<string, string>>,
): ChildProcess | undefined {
  const scriptUrl = new URL('./write-user-env.child.js', import.meta.url)
  const script = fileURLToPath(scriptUrl)
  if (!existsSync(script)) return undefined

  const child = spawn(process.execPath, [script], {
    stdio: ['pipe', 'ignore', 'pipe'],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    windowsHide: true,
  })
  child.stdin?.end(JSON.stringify(entries), 'utf8')
  child.stderr?.pipe(process.stderr)
  return child
}
