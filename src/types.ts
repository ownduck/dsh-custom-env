/** One editable environment variable row. */
export interface EnvEntry {
  /** Variable name. */
  readonly name: string
  /** Variable value. */
  readonly value: string
}

/** Snapshot returned by `customEnv/list`. */
export interface EnvSnapshot {
  /** Absolute path of `$DSH_HOME/.env`. */
  readonly path: string
  /** Whether the file exists on disk. */
  readonly exists: boolean
  /** Entries currently stored in the file (empty values omitted). */
  readonly entries: readonly EnvEntry[]
}

/** Snapshot returned by `customEnv/cliStatus` and `cliInstall`. */
export interface CliStatus {
  /** Host platform. */
  readonly platform: string
  /** First `dsh` found on the user environment PATH, if any. */
  readonly activePath: string | null
  /** Expected launcher for this Host, if resolved. */
  readonly expectedPath: string | null
  /** Expected bin directory (Windows PATH entry). */
  readonly expectedDirectory: string | null
  /** Whether active matches expected. */
  readonly matches: boolean
  /** Whether the Install button should be shown. */
  readonly canInstall: boolean
  /** Why install is unavailable or paths could not be resolved. */
  readonly reason: string | null
}
