/** Infer the CLI launcher this Host process should expose on PATH. */

import { existsSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import {
  findElectronResources,
  findLauncherDirectory,
  launcherName,
  looksLikeCliEntry,
} from './paths.ts'

function basenameLower(path: string): string {
  return basename(path).toLowerCase()
}

/** Resolved expected CLI locations, or a reason when resolution fails. */
export interface ExpectedCli {
  /** Absolute path of the launcher file (`dsh` / `dsh.cmd`). */
  readonly launcher: string
  /** Directory that should appear on PATH (Windows) or be the symlink target's directory. */
  readonly directory: string
  /** How the expectation was derived. */
  readonly kind: 'electron-resources' | 'argv' | 'walk'
}

/** Inputs for tests; defaults to the live process. */
export interface ResolveExpectedOptions {
  readonly platform?: NodeJS.Platform
  readonly execPath?: string
  readonly argv?: readonly string[]
  readonly electronRunAsNode?: string | undefined
  readonly exists?: (path: string) => boolean
}

/**
 * Infer the expected dsh launcher from how this Host was started.
 * @param options - optional process overrides for tests.
 * @returns expected locations, or `undefined` when unknown.
 */
export function resolveExpectedCli(options: ResolveExpectedOptions = {}): ExpectedCli | undefined {
  const platform = options.platform ?? process.platform
  const execPath = options.execPath ?? process.execPath
  const argv = options.argv ?? process.argv
  const electron = options.electronRunAsNode ?? process.env.ELECTRON_RUN_AS_NODE
  const exists = options.exists ?? existsSync
  const name = launcherName(platform)

  if (electron !== undefined && electron !== '') {
    const resources = findElectronResources(execPath, platform, exists)
    if (resources !== undefined) {
      const directory = join(resources, 'runtime', 'cli', 'bin')
      const launcher = join(directory, name)
      if (exists(launcher)) return { launcher: resolve(launcher), directory: resolve(directory), kind: 'electron-resources' }
    }
  }

  const argv1 = argv[1]
  if (looksLikeCliEntry(argv1) && argv1 !== undefined) {
    const file = resolve(argv1)
    if (exists(file)) {
      const base = basenameLower(file)
      if (base === name.toLowerCase() || base === 'dsh' || base === 'dsh.cmd') {
        return { launcher: file, directory: dirname(file), kind: 'argv' }
      }
      const directory = findLauncherDirectory(file, platform, 8, exists)
      if (directory !== undefined) {
        const launcher = join(directory, name)
        if (exists(launcher)) return { launcher: resolve(launcher), directory: resolve(directory), kind: 'argv' }
      }
      const siblingBin = join(dirname(file), 'bin', name)
      if (exists(siblingBin)) {
        return { launcher: resolve(siblingBin), directory: resolve(dirname(siblingBin)), kind: 'argv' }
      }
    }
  }

  if (argv1 !== undefined && argv1 !== '') {
    const walked = findLauncherDirectory(resolve(argv1), platform, 8, exists)
    if (walked !== undefined) {
      const launcher = join(walked, name)
      if (exists(launcher)) return { launcher: resolve(launcher), directory: resolve(walked), kind: 'walk' }
    }
  }

  return undefined
}
