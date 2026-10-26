/** Session types and Host-start baseline classification. */

export type EnvEntryKind = 'unchanged' | 'modified' | 'added'

/** Host-start original name and value for one row id. */
export interface BaselineRow {
  readonly name: string
  readonly value: string
}

/** One editable environment variable row. */
export interface EnvEntry {
  /** Stable row id; survives renames. */
  readonly id: string
  readonly name: string
  readonly value: string
  readonly kind: EnvEntryKind
  /** Host-start original value when `kind === 'modified'`; otherwise `null`. */
  readonly previous: string | null
}

/** Snapshot returned by `customEnv/list`. */
export interface EnvSnapshot {
  readonly path: string
  readonly exists: boolean
  readonly entries: readonly EnvEntry[]
}

/** Snapshot returned by `customEnv/cliStatus` and `cliInstall`. */
export interface CliStatus {
  readonly platform: string
  readonly activePath: string | null
  readonly expectedPath: string | null
  readonly expectedDirectory: string | null
  readonly matches: boolean
  readonly canInstall: boolean
  readonly reason: string | null
}

/**
 * Classify one row against the Host-start baseline by stable id.
 * @param id - row id.
 * @param name - current file name.
 * @param value - current file value.
 * @param baselineById - Host-start originals.
 */
export function classifyEntry(
  id: string,
  name: string,
  value: string,
  baselineById: ReadonlyMap<string, BaselineRow>,
): { readonly kind: EnvEntryKind; readonly previous: string | null } {
  const base = baselineById.get(id)
  if (base === undefined) return { kind: 'added', previous: null }
  if (base.name !== name || base.value !== value) return { kind: 'modified', previous: base.value }
  return { kind: 'unchanged', previous: null }
}
