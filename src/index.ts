/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { cliInstall as installCli, cliStatus as readCliStatus } from './cli-path/index.ts'
import { envFilePath, listEnvEntries, loadEnvMap, removeEnvEntry, upsertEnvEntry } from './env-file.ts'
import { isWritableEnvName } from './names.ts'
import { persistUserEnv, removeUserEnv } from './os-user-env/index.ts'
import type { CliStatus, EnvSnapshot } from './types.ts'

export type { CliStatus, EnvEntry, EnvSnapshot } from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** `$DSH_HOME/.env` management remote. */
    customEnv: CustomEnvController
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    /** Name refused by bootstrap rules or dotenv syntax. */
    'custom-env/invalid-name': { readonly name: string }
    /** Empty value rejected on upsert. */
    'custom-env/invalid-value': { readonly name: string }
    /** CLI PATH / symlink install failed. */
    'custom-env/cli-install-failed': { readonly code: string }
  }
}

/**
 * Apply a map onto `process.env` and the OS user environment.
 * @param entries - values to assign.
 */
function applyLive(entries: Readonly<Record<string, string>>): void {
  for (const [key, value] of Object.entries(entries)) {
    process.env[key] = value
  }
  try {
    persistUserEnv(entries)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    process.stderr.write(`custom-env: failed to persist OS user environment: ${detail}\n`)
  }
}

/**
 * Remove one key from `process.env` and the OS user environment.
 * @param name - variable to clear.
 */
function clearLive(name: string): void {
  delete process.env[name]
  try {
    removeUserEnv(name)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    process.stderr.write(`custom-env: failed to remove OS user environment ${name}: ${detail}\n`)
  }
}

/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */
export default class CustomEnvController extends TypertRemoteService {
  constructor(ctx: Context) {
    super(ctx, 'customEnv')
    const loaded = loadEnvMap()
    applyLive(loaded)
  }

  /**
   * List current `$DSH_HOME/.env` entries.
   * @returns path, existence, and sorted entries.
   */
  @Remote('list')
  async list(): Promise<EnvSnapshot> {
    const { path, exists, entries } = listEnvEntries()
    return { path, exists, entries }
  }

  /**
   * Create or replace one entry, syncing Host and OS user environment.
   * @param name - writable variable name.
   * @param value - non-empty value.
   * @returns updated snapshot.
   */
  @Remote('upsert')
  async upsert(name: string, value: string): Promise<EnvSnapshot> {
    if (!isWritableEnvName(name)) {
      throw new RemoteError('custom-env/invalid-name', `refused name "${name}"`, { name })
    }
    if (value === '') {
      throw new RemoteError('custom-env/invalid-value', `empty value for "${name}"`, { name })
    }
    try {
      upsertEnvEntry(name, value)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new RemoteError('custom-env/invalid-name', message, { name }, { cause: error })
    }
    applyLive({ [name]: value })
    return this.list()
  }

  /**
   * Delete one entry from the file, Host, and OS user environment.
   * @param name - writable variable name.
   * @returns updated snapshot.
   */
  @Remote('remove')
  async remove(name: string): Promise<EnvSnapshot> {
    if (!isWritableEnvName(name)) {
      throw new RemoteError('custom-env/invalid-name', `refused name "${name}"`, { name })
    }
    try {
      removeEnvEntry(name)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new RemoteError('custom-env/invalid-name', message, { name }, { cause: error })
    }
    clearLive(name)
    return this.list()
  }

  /**
   * Compare the user-environment `dsh` with the launcher expected for this Host.
   * @returns active path, expected path, and whether Install should be offered.
   */
  @Remote('cliStatus')
  async cliStatus(): Promise<CliStatus> {
    return readCliStatus()
  }

  /**
   * Install the expected CLI onto the Windows user PATH or as `/usr/local/bin/dsh` on macOS.
   * @returns refreshed status after install.
   */
  @Remote('cliInstall')
  async cliInstall(): Promise<CliStatus> {
    try {
      return await installCli()
    } catch (error) {
      const code = typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : 'EIO'
      const message = error instanceof Error ? error.message : String(error)
      throw new RemoteError('custom-env/cli-install-failed', message, { code }, { cause: error })
    }
  }
}

/** Re-export path helper for tests. */
export { envFilePath }
