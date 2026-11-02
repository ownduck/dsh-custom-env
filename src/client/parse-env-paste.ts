/** Parse clipboard text into environment name/value pairs for Settings paste. */

/** Valid dotenv key characters (same rule as the Settings name field). */
const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u

/** One parsed assignment from a paste. */
export interface ParsedEnvPair {
  readonly name: string
  readonly value: string
}

/**
 * Parse multiline `NAME=VALUE` paste text into pairs.
 * Trims lines and spaces around `=`; splits on the first `=`; skips blanks and invalid names.
 * Duplicate names in one paste keep the last value.
 * @param text - Clipboard text.
 * @returns Ordered unique pairs (last duplicate wins).
 */
export function parseEnvPaste(text: string): ParsedEnvPair[] {
  const lastByName = new Map<string, string>()
  const order: string[] = []
  for (const rawLine of text.split(/\r\n|\n|\r/u)) {
    const line = rawLine.trim()
    if (line === '') continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const name = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    if (!NAME_OK.test(name)) continue
    if (!lastByName.has(name)) order.push(name)
    lastByName.set(name, value)
  }
  return order.map(name => ({ name, value: lastByName.get(name)! }))
}

/**
 * Format pairs for clipboard copy (one `NAME=VALUE` per line).
 * Skips empty names. Does not trim values beyond what the caller provides.
 * @param pairs - Ordered name/value pairs.
 * @returns Clipboard text; empty string when no usable pairs.
 */
export function formatEnvCopy(pairs: readonly ParsedEnvPair[]): string {
  const lines: string[] = []
  for (const pair of pairs) {
    const name = pair.name.trim()
    if (name === '') continue
    lines.push(`${name}=${pair.value}`)
  }
  return lines.join('\n')
}
