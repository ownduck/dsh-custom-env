/** Shared path helpers for CLI install status. */

import { existsSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path'

/** Launcher file name for the current platform. */
export function launcherName(platform: NodeJS.Platform = process.platform): string {
  return platform === 'win32' ? 'dsh.cmd' : 'dsh'
}

/**
 * Compare two absolute paths for equality.
 * @param left - first path.
 * @param right - second path.
 * @param platform - override for tests.
 */
export function samePath(left: string, right: string, platform: NodeJS.Platform = process.platform): boolean {
  const a = normalizeComparable(left, platform)
  const b = normalizeComparable(right, platform)
  return a === b
}

/**
 * Normalize a path for comparison (absolute, trimmed separators; lower-case on Windows).
 * @param path - input path.
 * @param platform - override for tests.
 */
export function normalizeComparable(path: string, platform: NodeJS.Platform = process.platform): string {
  const expanded = path.trim().replace(/^"|"$/gu, '')
  try {
    const full = isAbsolute(expanded) ? resolve(expanded) : expanded
    const trimmed = full.replace(/[/\\]+$/u, '')
    return platform === 'win32' ? trimmed.toUpperCase() : trimmed
  } catch {
    return platform === 'win32' ? expanded.toUpperCase() : expanded
  }
}

/**
 * Resolve `…/resources` next to an Electron executable when present.
 * @param execPath - `process.execPath`.
 * @param platform - override for tests.
 * @param exists - filesystem probe.
 * @returns resources directory or `undefined`.
 */
export function findElectronResources(
  execPath: string,
  platform: NodeJS.Platform = process.platform,
  exists: (path: string) => boolean = existsSync,
): string | undefined {
  const dir = dirname(execPath)
  const candidates = [
    join(dir, 'resources'),
    join(dir, '..', 'Resources'),
    join(dir, '..', 'resources'),
  ]
  const name = launcherName(platform)
  for (const candidate of candidates) {
    const cliBin = join(candidate, 'runtime', 'cli', 'bin', name)
    if (exists(cliBin)) return resolve(candidate)
  }
  return undefined
}

/**
 * Walk parents of `start` looking for a directory that contains the launcher.
 * @param start - file or directory to start from.
 * @param platform - override for tests.
 * @param maxHops - parent hops.
 * @param exists - filesystem probe.
 */
export function findLauncherDirectory(
  start: string,
  platform: NodeJS.Platform = process.platform,
  maxHops = 8,
  exists: (path: string) => boolean = existsSync,
): string | undefined {
  let current = resolve(start)
  const name = launcherName(platform)
  for (let i = 0; i < maxHops; i += 1) {
    const asFile = join(dirname(current), name)
    if (exists(asFile) && basename(asFile) === name) return dirname(asFile)
    const asDir = join(current, name)
    if (exists(asDir)) return current
    const inBin = join(current, 'bin', name)
    if (exists(inBin)) return join(current, 'bin')
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return undefined
}

/**
 * Whether `argv1` looks like a DSH CLI entry script.
 * @param argv1 - `process.argv[1]`.
 */
export function looksLikeCliEntry(argv1: string | undefined): boolean {
  if (argv1 === undefined || argv1 === '') return false
  const base = basename(argv1).toLowerCase()
  return base === 'dsh' || base === 'dsh.cmd' || base === 'dsh.js' || base === 'cli.js'
    || base === 'cli.mjs' || base.endsWith('.js') && argv1.replaceAll('\\', '/').includes('/dsh')
}

/**
 * Join PATH-like segments with the platform separator.
 * @param parts - path segments (may be empty).
 * @param platform - override for tests.
 */
export function joinPathEnv(parts: readonly string[], platform: NodeJS.Platform = process.platform): string {
  const sepChar = platform === 'win32' ? ';' : ':'
  return parts.filter(part => part !== '').join(sepChar)
}

export { dirname, existsSync, isAbsolute, join, normalize, resolve, sep, basename }
