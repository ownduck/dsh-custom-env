/**
 * Persist user environment variables on macOS via launchctl and a Login LaunchAgent.
 */
/**
 * Whether `name` is present in this process's macOS user-env tracking
 * (`process.env` or the in-memory LaunchAgent cache).
 * @param name - Variable name.
 * @param platform - Override for tests; defaults to `process.platform`.
 * @returns true when the name is already managed/visible.
 */
export declare function hasMacosUserEnv(name: string, platform?: NodeJS.Platform): boolean;
/**
 * Set user-domain environment variables for new GUI sessions and refresh the Login Agent.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function writeMacosUserEnv(entries: Readonly<Record<string, string>>, platform?: NodeJS.Platform): void;
/**
 * Unset many user-domain environment variables and refresh the Login Agent once.
 * @param names - Variable names to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function removeMacosUserEnvs(names: readonly string[], platform?: NodeJS.Platform): void;
/**
 * Unset one user-domain environment variable and refresh the Login Agent.
 * @param name - Variable name to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export declare function removeMacosUserEnv(name: string, platform?: NodeJS.Platform): void;
