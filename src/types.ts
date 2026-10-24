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
