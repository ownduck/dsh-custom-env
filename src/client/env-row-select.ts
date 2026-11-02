/** Pure helpers for Environment row multi-select and KEY=VALUE copy. */

import { formatEnvCopy } from './parse-env-paste.ts'

/** Ctrl (Windows/Linux) or Meta (macOS) — required for click-to-toggle selection. */
export function isSelectionEditKey(event: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return event.ctrlKey || event.metaKey
}

/**
 * Inclusive id span between two anchors in list order.
 * @param ordered - Selectable row ids in display order.
 * @param from - Range start id.
 * @param to - Range end id.
 * @returns Ordered ids from the earlier index through the later; empty if either id is missing.
 */
export function rangeIds(ordered: readonly string[], from: string, to: string): string[] {
  const a = ordered.indexOf(from)
  const b = ordered.indexOf(to)
  if (a < 0 || b < 0) return from === to && a >= 0 ? [from] : []
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  return ordered.slice(start, end + 1)
}

/** Drop the browser text selection (not row selection). */
export function clearDomTextSelection(): void {
  const selection = window.getSelection()
  if (selection !== null && selection.rangeCount > 0) selection.removeAllRanges()
}

/** True when the focused input/textarea has a non-empty character range. */
export function hasFocusedInputTextSelection(): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement) && !(active instanceof HTMLTextAreaElement)) return false
  const start = active.selectionStart
  const end = active.selectionEnd
  return start !== null && end !== null && start !== end
}

/**
 * Build clipboard text for selected rows in list order.
 * @param selectedIds - Selected row ids.
 * @param orderedIds - Display order (saved then pending).
 * @param drafts - Current name/value drafts by id.
 * @returns `NAME=VALUE` lines, or empty when nothing usable.
 */
export function selectedEnvCopyText(
  selectedIds: ReadonlySet<string>,
  orderedIds: readonly string[],
  drafts: Readonly<Record<string, { name: string; value: string }>>,
): string {
  if (selectedIds.size === 0) return ''
  const pairs = orderedIds.flatMap((id) => {
    if (!selectedIds.has(id)) return []
    const draft = drafts[id]
    if (draft === undefined) return []
    const name = draft.name.trim()
    if (name === '') return []
    return [{ name, value: draft.value }]
  })
  return formatEnvCopy(pairs)
}

/**
 * Resolve the env row under a client point, if any.
 * @param clientX - Viewport X.
 * @param clientY - Viewport Y.
 * @returns `data-env-row` id, or undefined.
 */
export function rowIdFromPoint(clientX: number, clientY: number): string | undefined {
  const hit = document.elementFromPoint(clientX, clientY)
  if (!(hit instanceof Element)) return undefined
  const row = hit.closest('[data-env-row]')
  if (!(row instanceof HTMLElement)) return undefined
  const id = row.dataset.envRow
  return id === undefined || id === '' ? undefined : id
}
