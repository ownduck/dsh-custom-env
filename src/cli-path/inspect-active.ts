/** Locate the first `dsh` visible on the user + machine PATH. */

import { accessSync, constants, existsSync, lstatSync, readlinkSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { launcherName, normalizeComparable } from './paths.ts'

const MAC_DESTINATION = '/usr/local/bin/dsh'

/** Result of scanning PATH for an active dsh command. */
export interface ActiveCli {
  /** Absolute path of the first matching launcher, if any. */
  readonly path: string | undefined
  /** When `path` is a symlink, its resolved target (macOS / POSIX). */
  readonly symlinkTarget: string | undefined
}

/** Inputs for tests. */
export interface InspectActiveOptions {
  readonly platform?: NodeJS.Platform
  readonly pathEnv?: string | undefined
  readonly machinePath?: string | undefined
  readonly pathext?: string | undefined
  readonly exists?: (path: string) => boolean
  readonly isExecutable?: (path: string) => boolean
  readonly readLink?: (path: string) => string | undefined
}

/**
 * Find the first `dsh` on PATH (machine then user on Windows).
 * @param options - optional env overrides for tests.
 */
export function inspectActiveCli(options: InspectActiveOptions = {}): ActiveCli {
  const platform = options.platform ?? process.platform
  const exists = options.exists ?? existsSync
  const isExecutable = options.isExecutable ?? ((path: string) => {
    try {
      accessSync(path, constants.X_OK)
      return true
    } catch {
      return exists(path)
    }
  })
  const readLink = options.readLink ?? ((path: string) => {
    try {
      if (!lstatSync(path).isSymbolicLink()) return undefined
      return readlinkSync(path)
    } catch {
      return undefined
    }
  })

  if (platform === 'win32') {
    return inspectWindows(options, exists)
  }
  return inspectPosix(platform, options, exists, isExecutable, readLink)
}

function inspectWindows(
  options: InspectActiveOptions,
  exists: (path: string) => boolean,
): ActiveCli {
  const machine = options.machinePath ?? readWindowsMachinePath()
  const user = options.pathEnv ?? readWindowsUserPath()
  const combined = `${machine};${user}`
  const extensions = (options.pathext ?? process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map(ext => ext.trim())
    .filter(ext => ext !== '')
  const searchExt = ['.ps1', ...extensions]

  for (const part of combined.split(';')) {
    const directory = expandWindowsPath(part.trim().replace(/^"|"$/gu, ''))
    if (directory === '' || !isAbsolute(directory)) continue
    for (const extension of searchExt) {
      const candidate = join(directory, `dsh${extension}`)
      try {
        if (exists(candidate)) return { path: candidate, symlinkTarget: undefined }
      } catch {
        // skip invalid candidates
      }
    }
  }
  return { path: undefined, symlinkTarget: undefined }
}

function inspectPosix(
  platform: NodeJS.Platform,
  options: InspectActiveOptions,
  exists: (path: string) => boolean,
  isExecutable: (path: string) => boolean,
  readLink: (path: string) => string | undefined,
): ActiveCli {
  const pathEnv = options.pathEnv ?? process.env.PATH ?? ''
  const name = launcherName(platform)
  for (const part of pathEnv.split(':')) {
    const directory = part.trim()
    if (directory === '') continue
    const candidate = join(directory, name)
    try {
      if (!exists(candidate)) continue
      if (!isExecutable(candidate) && platform !== 'darwin') continue
      const symlinkTarget = readLink(candidate)
      return { path: candidate, symlinkTarget }
    } catch {
      // skip
    }
  }

  // Supplement: fixed Desktop destination even if not first on PATH
  if (platform === 'darwin' && exists(MAC_DESTINATION)) {
    return { path: MAC_DESTINATION, symlinkTarget: readLink(MAC_DESTINATION) }
  }
  return { path: undefined, symlinkTarget: undefined }
}

function readWindowsUserPath(): string {
  // Prefer registry-backed user PATH via process env when Host inherited it;
  // install/inspect via PowerShell uses the registry directly.
  return process.env.Path ?? process.env.PATH ?? ''
}

function readWindowsMachinePath(): string {
  return ''
}

function expandWindowsPath(value: string): string {
  return value.replace(/%([^%]+)%/gu, (_match, name: string) => process.env[name] ?? `%${name}%`)
}

/**
 * Whether the active CLI matches the expected launcher.
 * On macOS, prefer symlink target comparison when active is `/usr/local/bin/dsh`.
 * @param active - PATH scan result.
 * @param expectedLauncher - expected absolute launcher.
 * @param platform - override for tests.
 */
export function activeMatchesExpected(
  active: ActiveCli,
  expectedLauncher: string,
  platform: NodeJS.Platform = process.platform,
): boolean {
  if (active.path === undefined) return false
  if (platform === 'darwin') {
    const target = active.symlinkTarget
    if (target !== undefined && target !== '') {
      const resolved = target.startsWith('/') ? target : join(active.path, '..', target)
      if (normalizeComparable(resolved, platform) === normalizeComparable(expectedLauncher, platform)) {
        return true
      }
    }
  }
  return normalizeComparable(active.path, platform) === normalizeComparable(expectedLauncher, platform)
}

export { MAC_DESTINATION }
