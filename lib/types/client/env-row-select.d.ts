/** Pure helpers for Environment row multi-select and KEY=VALUE copy. */
/** Ctrl (Windows/Linux) or Meta (macOS) — required for click-to-toggle selection. */
export declare function isSelectionEditKey(event: {
    ctrlKey: boolean;
    metaKey: boolean;
}): boolean;
/**
 * Inclusive id span between two anchors in list order.
 * @param ordered - Selectable row ids in display order.
 * @param from - Range start id.
 * @param to - Range end id.
 * @returns Ordered ids from the earlier index through the later; empty if either id is missing.
 */
export declare function rangeIds(ordered: readonly string[], from: string, to: string): string[];
/** Drop the browser text selection (not row selection). */
export declare function clearDomTextSelection(): void;
/** True when the focused input/textarea has a non-empty character range. */
export declare function hasFocusedInputTextSelection(): boolean;
/**
 * Build clipboard text for selected rows in list order.
 * @param selectedIds - Selected row ids.
 * @param orderedIds - Display order (saved then pending).
 * @param drafts - Current name/value drafts by id.
 * @returns `NAME=VALUE` lines, or empty when nothing usable.
 */
export declare function selectedEnvCopyText(selectedIds: ReadonlySet<string>, orderedIds: readonly string[], drafts: Readonly<Record<string, {
    name: string;
    value: string;
}>>): string;
/**
 * Resolve the env row under a client point, if any.
 * @param clientX - Viewport X.
 * @param clientY - Viewport Y.
 * @returns `data-env-row` id, or undefined.
 */
export declare function rowIdFromPoint(clientX: number, clientY: number): string | undefined;
