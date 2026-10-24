/** Shared path helpers for CLI install status. */
import { existsSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
/** Launcher file name for the current platform. */
export declare function launcherName(platform?: NodeJS.Platform): string;
/**
 * Compare two absolute paths for equality.
 * @param left - first path.
 * @param right - second path.
 * @param platform - override for tests.
 */
export declare function samePath(left: string, right: string, platform?: NodeJS.Platform): boolean;
/**
 * Normalize a path for comparison (absolute, trimmed separators; lower-case on Windows).
 * @param path - input path.
 * @param platform - override for tests.
 */
export declare function normalizeComparable(path: string, platform?: NodeJS.Platform): string;
/**
 * Resolve `…/resources` next to an Electron executable when present.
 * @param execPath - `process.execPath`.
 * @param platform - override for tests.
 * @param exists - filesystem probe.
 * @returns resources directory or `undefined`.
 */
export declare function findElectronResources(execPath: string, platform?: NodeJS.Platform, exists?: (path: string) => boolean): string | undefined;
/**
 * Walk parents of `start` looking for a directory that contains the launcher.
 * @param start - file or directory to start from.
 * @param platform - override for tests.
 * @param maxHops - parent hops.
 * @param exists - filesystem probe.
 */
export declare function findLauncherDirectory(start: string, platform?: NodeJS.Platform, maxHops?: number, exists?: (path: string) => boolean): string | undefined;
/**
 * Whether `argv1` looks like a DSH CLI entry script.
 * @param argv1 - `process.argv[1]`.
 */
export declare function looksLikeCliEntry(argv1: string | undefined): boolean;
/**
 * Join PATH-like segments with the platform separator.
 * @param parts - path segments (may be empty).
 * @param platform - override for tests.
 */
export declare function joinPathEnv(parts: readonly string[], platform?: NodeJS.Platform): string;
export { dirname, existsSync, isAbsolute, join, normalize, resolve, sep, basename };
