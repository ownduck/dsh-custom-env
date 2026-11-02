/** Settings section: `$DSH_HOME/.env` editor + global `dsh` path. */

import {
  useCallback, useEffect, useRef, useState,
  type ClipboardEvent, type MouseEvent, type ReactNode,
} from 'react'
import {
  Button,
  IconCheckOutlineRegular,
  IconCloseOutlineRegular,
  IconLinkOutlineRegular,
  IconLoadingOutlineRegular,
  IconRefreshOutlineRegular,
  IconTrashOutlineRegular,
  IconWarningOutlineRegular,
  Input,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { CliStatus, EnvEntry, EnvSnapshot } from '../types.ts'
import { formatRemoteError } from './format-remote-error.ts'
import type { EnvSettingsKey } from './locales.ts'
import {
  clearDomTextSelection,
  hasFocusedInputTextSelection,
  isSelectionEditKey,
  rangeIds,
  rowIdFromPoint,
  selectedEnvCopyText,
} from './env-row-select.ts'
import { parseEnvPaste } from './parse-env-paste.ts'
import css from './EnvSettingsSection.module.css'

export interface EnvSettingsInjected {
  readonly load: () => Promise<EnvSnapshot>
  /** Create (`id === ""`) or update/rename one row by stable id. */
  readonly upsert: (id: string, name: string, value: string) => Promise<EnvSnapshot>
  readonly remove: (id: string) => Promise<EnvSnapshot>
  readonly restore: (id: string) => Promise<EnvSnapshot>
  readonly cliStatus: () => Promise<CliStatus>
  readonly cliInstall: () => Promise<CliStatus>
}

export type EnvSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.env'>
  & InjectFace<EnvSettingsInjected>

const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u
/** Always-empty composer row at the bottom of the list. */
const COMPOSER_ID = ''
const PENDING_PREFIX = 'pending:'

type BusyTarget = 'boot' | 'cli' | `row:${string}` | `pending:${string}`
type Translate = EnvSettingsSectionProps['t']
interface Draft { name: string; value: string }

function isPendingId(id: string): boolean {
  return id.startsWith(PENDING_PREFIX)
}

function IconAction({
  label, disabled, onClick, danger, primary, children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  danger?: boolean
  primary?: boolean
  children: ReactNode
}): ReactNode {
  return (
    <Tooltip portal label={label} side="top" delayMs={400}>
      <button
        type="button"
        className={[css.iconButton, danger ? css.iconButtonDanger : '', primary ? css.iconButtonPrimary : ''].filter(Boolean).join(' ')}
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  )
}

function Slot({ empty, children }: { empty: boolean; children: ReactNode }): ReactNode {
  return <div className={css.slot} data-empty={empty ? 'true' : 'false'}>{empty ? null : children}</div>
}

/** Slots: confirm|restart · cancel|restore · delete. */
function RowActions({
  t, busy, loading, dirty, canConfirm, pending = false, showRemove = true,
  onConfirm, onCancel, onRestore, onRemove,
}: {
  t: Translate
  busy: boolean
  loading: boolean
  dirty: boolean
  canConfirm: boolean
  pending?: boolean
  showRemove?: boolean
  onConfirm: () => void
  onCancel: () => void
  onRestore: () => void
  onRemove: () => void
}): ReactNode {
  return (
    <div className={css.actions} role="group" aria-label={t('field.actions')}>
      <Slot empty={!dirty && !pending}>
        {dirty ? (
          <IconAction label={loading ? t('panel.loading') : t('action.confirm')} primary disabled={busy || !canConfirm} onClick={onConfirm}>
            {loading ? <IconLoadingOutlineRegular className={css.spinner} size={14} /> : <IconCheckOutlineRegular size={14} />}
          </IconAction>
        ) : (
          <Tooltip portal label={t('status.restartRequired')} side="top" delayMs={400}>
            <span className={css.restartBadge} role="img" aria-label={t('status.restartRequired')} title={t('status.restartRequired')}>
              <IconWarningOutlineRegular size={14} />
            </span>
          </Tooltip>
        )}
      </Slot>
      <Slot empty={!dirty && !pending}>
        {dirty ? (
          <IconAction label={t('action.cancel')} disabled={busy} onClick={onCancel}>
            <IconCloseOutlineRegular size={14} />
          </IconAction>
        ) : (
          <IconAction label={t('action.restore')} disabled={busy} onClick={onRestore}>
            <IconRefreshOutlineRegular size={14} />
          </IconAction>
        )}
      </Slot>
      <Slot empty={!showRemove}>
        <IconAction label={t('action.remove')} danger disabled={busy} onClick={onRemove}>
          <IconTrashOutlineRegular size={14} />
        </IconAction>
      </Slot>
    </div>
  )
}

function Field(props: {
  id: string
  value: string
  label: string
  title: string
  disabled?: boolean
  placeholder?: string
  invalid?: boolean
  /** When true, mousedown bubbles so the whole row owns selection (plain click still focuses). */
  rowSelectGestures?: boolean
  onChange: (value: string) => void
  onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void
}): ReactNode {
  return (
    <div className={css.field}>
      <Input
        className={css.fieldInput}
        id={props.id}
        value={props.value}
        disabled={props.disabled}
        placeholder={props.placeholder}
        title={props.title}
        aria-invalid={props.invalid || undefined}
        aria-label={props.label}
        onMouseDown={(event) => {
          if (!props.rowSelectGestures) {
            event.stopPropagation()
            return
          }
          // Ctrl/Meta row-select: skip caret. Plain click focuses for editing.
          if (isSelectionEditKey(event)) event.preventDefault()
        }}
        onChange={(event) => { props.onChange(event.target.value) }}
        onPaste={props.onPaste}
      />
    </div>
  )
}

/**
 * Render the environment settings page.
 * @param props - locale `t` and Host remote callbacks.
 */
export function EnvSettingsSection({
  t, load, upsert, remove, restore, cliStatus, cliInstall,
}: EnvSettingsSectionProps) {
  const [snapshot, setSnapshot] = useState<EnvSnapshot | undefined>()
  const [cli, setCli] = useState<CliStatus | undefined>()
  const [drafts, setDrafts] = useState<Record<string, Draft>>({ [COMPOSER_ID]: { name: '', value: '' } })
  const [pendingOrder, setPendingOrder] = useState<string[]>([])
  const [busyTarget, setBusyTarget] = useState<BusyTarget | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [nameError, setNameError] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | undefined>()
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const pendingSeq = useRef(0)
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const pendingOrderRef = useRef(pendingOrder)
  pendingOrderRef.current = pendingOrder
  const selectedRef = useRef(selectedIds)
  selectedRef.current = selectedIds
  const anchorIdRef = useRef<string | undefined>(undefined)
  const dragModeRef = useRef<'range' | 'toggle' | undefined>(undefined)
  const dragVisitedRef = useRef<Set<string>>(new Set())
  /** Plain press arms drag; selection commits only after the pointer crosses rows. */
  const dragPendingCrossRef = useRef(false)
  const pendingRemoveRef = useRef(pendingRemove)
  pendingRemoveRef.current = pendingRemove

  const busy = busyTarget !== undefined
  const entries = snapshot?.entries ?? []
  const taken = new Set(entries.map(entry => entry.name))
  const selectableOrder = [...entries.map(entry => entry.id), ...pendingOrder]
  const selectableOrderRef = useRef(selectableOrder)
  selectableOrderRef.current = selectableOrder

  const keepPendingDrafts = (
    current: Record<string, Draft>,
    dropId?: string,
  ): Record<string, Draft> => {
    const kept: Record<string, Draft> = {}
    for (const [id, draft] of Object.entries(current)) {
      if (!isPendingId(id) || id === dropId) continue
      kept[id] = draft
    }
    return kept
  }

  const applySnapshot = (next: EnvSnapshot, dropPendingId?: string): void => {
    setSnapshot(next)
    if (dropPendingId !== undefined) {
      setPendingOrder(order => order.filter(item => item !== dropPendingId))
      setSelectedIds(previous => {
        if (!previous.has(dropPendingId)) return previous
        const ids = new Set(previous)
        ids.delete(dropPendingId)
        return ids
      })
      if (anchorIdRef.current === dropPendingId) anchorIdRef.current = undefined
    }
    setDrafts(current => ({
      [COMPOSER_ID]: { name: '', value: '' },
      ...keepPendingDrafts(current, dropPendingId),
      ...Object.fromEntries(next.entries.map(entry => [entry.id, { name: entry.name, value: entry.value }])),
    }))
  }

  const setDraft = (id: string, patch: Partial<Draft>): void => {
    setDrafts(previous => ({
      ...previous,
      [id]: { name: patch.name ?? previous[id]?.name ?? '', value: patch.value ?? previous[id]?.value ?? '' },
    }))
  }

  const dropPending = (id: string): void => {
    setPendingOrder(order => order.filter(item => item !== id))
    setSelectedIds(previous => {
      if (!previous.has(id)) return previous
      const next = new Set(previous)
      next.delete(id)
      return next
    })
    if (anchorIdRef.current === id) anchorIdRef.current = undefined
    setDrafts(previous => {
      const next = { ...previous }
      delete next[id]
      return next
    })
  }

  const clearSelection = (): void => {
    setSelectedIds(new Set())
    anchorIdRef.current = undefined
    clearDomTextSelection()
  }

  const pruneSelection = (allowed: ReadonlySet<string>): void => {
    setSelectedIds(previous => {
      let changed = false
      const next = new Set<string>()
      for (const id of previous) {
        if (allowed.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : previous
    })
    if (anchorIdRef.current !== undefined && !allowed.has(anchorIdRef.current)) {
      anchorIdRef.current = undefined
    }
  }

  const run = async (
    target: BusyTarget,
    action: () => Promise<EnvSnapshot>,
    dropPendingId?: string,
  ): Promise<void> => {
    if (busyTarget !== undefined) return
    setBusyTarget(target)
    setError(undefined)
    try {
      applySnapshot(await action(), dropPendingId)
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusyTarget(undefined)
    }
  }

  const refresh = useCallback(async () => {
    setBusyTarget('boot')
    setError(undefined)
    try {
      setPendingOrder([])
      clearSelection()
      const next = await load()
      setSnapshot(next)
      setDrafts({
        [COMPOSER_ID]: { name: '', value: '' },
        ...Object.fromEntries(next.entries.map(entry => [entry.id, { name: entry.name, value: entry.value }])),
      })
      try { setCli(await cliStatus()) } catch { setCli(undefined) }
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusyTarget(undefined)
    }
  }, [load, cliStatus, t])

  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    const allowed = new Set(selectableOrder)
    pruneSelection(allowed)
  }, [selectableOrder.join('\0')])

  const stopEditingGesture = (): void => {
    clearDomTextSelection()
    const active = document.activeElement
    if (active instanceof HTMLInputElement && active.closest(`.${css.list}`) !== null) active.blur()
  }

  /** Extend an armed drag onto `id` (pointer hit-test while primary button is down). */
  const applyDragOverRow = (id: string): void => {
    if (dragModeRef.current === undefined) return
    if (dragModeRef.current === 'toggle') {
      if (dragVisitedRef.current.has(id)) return
      stopEditingGesture()
      dragVisitedRef.current.add(id)
      setSelectedIds((previous) => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      return
    }
    // Plain drag selects only after the pointer leaves the press row.
    if (dragPendingCrossRef.current && id === anchorIdRef.current) return
    if (dragPendingCrossRef.current || id !== anchorIdRef.current) {
      dragPendingCrossRef.current = false
      stopEditingGesture()
    }
    dragVisitedRef.current.add(id)
    setSelectedIds(new Set(rangeIds(selectableOrderRef.current, anchorIdRef.current ?? id, id)))
  }

  useEffect(() => {
    if (selectedIds.size > 0) clearDomTextSelection()
  }, [selectedIds])

  // One document/window subscription for drag tracking, outside-click clear, and copy.
  useEffect(() => {
    const endDrag = (): void => {
      dragModeRef.current = undefined
      dragVisitedRef.current = new Set()
      dragPendingCrossRef.current = false
    }
    const onMove = (event: globalThis.MouseEvent): void => {
      if (event.buttons !== 1 || dragModeRef.current === undefined) return
      const id = rowIdFromPoint(event.clientX, event.clientY)
      if (id !== undefined) applyDragOverRow(id)
    }
    const onPointerDown = (event: globalThis.MouseEvent): void => {
      if (selectedRef.current.size === 0 || pendingRemoveRef.current !== undefined) return
      if (!(event.target instanceof Element)) return
      if (event.target.closest('[data-env-row]') !== null) return
      clearSelection()
    }
    const copyText = (): string =>
      selectedEnvCopyText(selectedRef.current, selectableOrderRef.current, draftsRef.current)
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (selectedRef.current.size === 0) return
      if ((event.key !== 'c' && event.key !== 'C') || !isSelectionEditKey(event) || event.altKey || event.shiftKey) return
      if (hasFocusedInputTextSelection()) return
      const text = copyText()
      if (text === '') return
      event.preventDefault()
      void navigator.clipboard.writeText(text)
    }
    const onCopy = (event: globalThis.ClipboardEvent): void => {
      if (selectedRef.current.size === 0 || hasFocusedInputTextSelection()) return
      const text = copyText()
      if (text === '') return
      event.preventDefault()
      event.clipboardData?.setData('text/plain', text)
    }
    window.addEventListener('mouseup', endDrag)
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mousedown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('copy', onCopy, true)
    return () => {
      window.removeEventListener('mouseup', endDrag)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mousedown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('copy', onCopy, true)
    }
  }, [])

  const saveExisting = (id: string, entryName: string): void => {
    const draft = drafts[id] ?? { name: '', value: '' }
    const name = draft.name.trim()
    const takenByOther = name !== entryName && taken.has(name)
    if (!NAME_OK.test(name) || takenByOther) {
      setNameError(true)
      return
    }
    if (draft.value === '') return
    setNameError(false)
    void run(`row:${id}`, () => upsert(id, name, draft.value))
  }

  const savePending = (id: string): void => {
    const draft = drafts[id] ?? { name: '', value: '' }
    const name = draft.name.trim()
    if (!NAME_OK.test(name) || taken.has(name)) {
      setNameError(true)
      return
    }
    if (draft.value === '') return
    setNameError(false)
    void run(`pending:${id}`, () => upsert(COMPOSER_ID, name, draft.value), id)
  }

  /** First keystroke on the empty composer promotes into a pending row so the empty row stays. */
  const typeIntoComposer = (patch: Partial<Draft>, focus: 'name' | 'value'): void => {
    setNameError(false)
    const base = draftsRef.current[COMPOSER_ID] ?? { name: '', value: '' }
    const next = { name: patch.name ?? base.name, value: patch.value ?? base.value }
    const id = `${PENDING_PREFIX}${++pendingSeq.current}`
    setDrafts(previous => ({
      ...previous,
      [id]: next,
      [COMPOSER_ID]: { name: '', value: '' },
    }))
    setPendingOrder(order => [...order, id])
    queueMicrotask(() => {
      document.getElementById(`env-${focus}-${id}`)?.focus()
    })
  }

  const appendPendingPairs = (pairs: readonly { name: string; value: string }[]): void => {
    if (pairs.length === 0) return
    setNameError(false)
    const previous = draftsRef.current
    const order = pendingOrderRef.current
    const nextDrafts = { ...previous, [COMPOSER_ID]: { name: '', value: '' } }
    const savedByName = new Map(entries.map(entry => [entry.name, entry.id]))
    const existingPendingByName = new Map<string, string>()
    for (const id of order) {
      const draft = previous[id]
      if (draft !== undefined) existingPendingByName.set(draft.name.trim(), id)
    }
    const added: string[] = []
    const dropPending = new Set<string>()
    for (const pair of pairs) {
      // Same name as a saved row: overlay that draft (dirty when value differs). No new row.
      const savedId = savedByName.get(pair.name)
      if (savedId !== undefined) {
        nextDrafts[savedId] = { name: pair.name, value: pair.value }
        const pendingDup = existingPendingByName.get(pair.name)
        if (pendingDup !== undefined) {
          delete nextDrafts[pendingDup]
          dropPending.add(pendingDup)
          existingPendingByName.delete(pair.name)
        }
        continue
      }
      const reuse = existingPendingByName.get(pair.name)
      if (reuse !== undefined) {
        nextDrafts[reuse] = { name: pair.name, value: pair.value }
        continue
      }
      const id = `${PENDING_PREFIX}${++pendingSeq.current}`
      nextDrafts[id] = { name: pair.name, value: pair.value }
      existingPendingByName.set(pair.name, id)
      added.push(id)
    }
    setDrafts(nextDrafts)
    if (added.length > 0 || dropPending.size > 0) {
      setPendingOrder([...order.filter(id => !dropPending.has(id)), ...added])
    }
  }

  const onComposerPaste = (event: ClipboardEvent<HTMLInputElement>): void => {
    const text = event.clipboardData.getData('text')
    const pairs = parseEnvPaste(text)
    if (pairs.length === 0) return
    event.preventDefault()
    appendPendingPairs(pairs)
  }

  const onRowMouseDown = (id: string, event: MouseEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement | null
    const onInput = target?.closest('input') !== null
    const onControl = target?.closest('button, a, [role="button"]') !== null

    if (isSelectionEditKey(event)) {
      event.preventDefault()
      clearDomTextSelection()
      dragPendingCrossRef.current = false
      if (event.shiftKey && anchorIdRef.current !== undefined) {
        const spanned = rangeIds(selectableOrder, anchorIdRef.current, id)
        setSelectedIds(new Set(spanned))
        dragModeRef.current = 'range'
        dragVisitedRef.current = new Set(spanned)
        return
      }
      setSelectedIds((previous) => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      anchorIdRef.current = id
      dragModeRef.current = 'toggle'
      dragVisitedRef.current = new Set([id])
      return
    }

    // Plain click does not select; press only arms drag until the pointer crosses rows.
    if (!onInput && !onControl) event.preventDefault()
    anchorIdRef.current = id
    dragModeRef.current = 'range'
    dragVisitedRef.current = new Set([id])
    dragPendingCrossRef.current = true
  }

  const composer = drafts[COMPOSER_ID] ?? { name: '', value: '' }
  const cliInstalling = busyTarget === 'cli'
  const cliBooting = busyTarget === 'boot' || cli === undefined
  const showCliAction = cli?.canInstall === true || cliInstalling
  const notice = error
    ?? (nameError ? t('error.invalidName') : undefined)
    ?? (cli?.reason === 'could-not-resolve-expected-cli' ? t('error.cliUnresolved') : undefined)
    ?? (cli?.reason === 'unsupported-platform' ? t('error.cliUnsupported') : undefined)

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('panel.title')}</h2>

      <section className={css.cli} aria-label={t('cli.title')}>
        <h3 className={css.cliHeading}>{t('cli.title')}</h3>
        <div className={css.cliBody}>
          <p
            className={css.cliPath}
            title={cliBooting ? undefined : (cli.activePath ?? undefined)}
            aria-busy={cliBooting || cliInstalling}
          >
            {cliBooting ? t('panel.loading') : cli.activePath === null ? t('cli.activeMissing') : cli.activePath}
          </p>
          <div className={css.cliSlot} data-empty={showCliAction ? 'false' : 'true'}>
            {showCliAction ? (
              <IconAction
                label={cliInstalling ? t('panel.loading') : cli?.platform === 'darwin' ? t('cli.macConflict') : t('cli.install')}
                disabled={busy}
                onClick={() => {
                  if (busyTarget !== undefined) return
                  setBusyTarget('cli')
                  setError(undefined)
                  void (async () => {
                    try { setCli(await cliInstall()) }
                    catch (err) { setError(formatRemoteError(err, t)) }
                    finally { setBusyTarget(undefined) }
                  })()
                }}
              >
                {cliInstalling
                  ? <IconLoadingOutlineRegular className={css.spinner} size={14} />
                  : <IconLinkOutlineRegular size={14} />}
              </IconAction>
            ) : null}
          </div>
        </div>
      </section>

      {notice !== undefined ? (
        <p className={css.notice} data-tone={error !== undefined || nameError ? 'error' : undefined} role="status">{notice}</p>
      ) : null}

      <div className={css.list}>
        <div className={css.header}>
          <p className={css.headerLabel}>{t('field.name')}</p>
          <p className={css.headerLabel}>{t('field.value')}</p>
          <div className={css.headerActions} aria-hidden="true" />
        </div>

        {snapshot !== undefined && entries.length === 0 && pendingOrder.length === 0 && notice === undefined
          ? <p className={css.empty}>{t('panel.empty')}</p>
          : null}

        {entries.map((entry: EnvEntry) => {
          const draft = drafts[entry.id] ?? { name: entry.name, value: entry.value }
          const dirty = draft.name !== entry.name || draft.value !== entry.value
          const pending = entry.kind === 'added' || entry.kind === 'modified'
          const loading = busyTarget === `row:${entry.id}`
          const nextName = draft.name.trim()
          const canConfirm = NAME_OK.test(nextName) && draft.value !== '' && !(nextName !== entry.name && taken.has(nextName))
          const selected = selectedIds.has(entry.id)
          return (
            <div
              key={entry.id}
              className={css.row}
              data-env-row={entry.id}
              data-selected={selected ? 'true' : 'false'}
              aria-selected={selected}
              onMouseDown={(event) => { onRowMouseDown(entry.id, event) }}
            >
              <Field
                id={`env-name-${entry.id}`}
                value={draft.name}
                disabled={busy}
                title={draft.name}
                invalid={nameError && dirty}
                label={t('field.name')}
                rowSelectGestures
                onChange={(name) => { setNameError(false); setDraft(entry.id, { name }) }}
              />
              <Field
                id={`env-value-${entry.id}`}
                value={draft.value}
                disabled={busy}
                title={draft.value}
                label={t('field.value')}
                rowSelectGestures
                onChange={(value) => { setDraft(entry.id, { value }) }}
              />
              <RowActions
                t={t}
                busy={busy}
                loading={loading}
                dirty={dirty || loading}
                canConfirm={canConfirm}
                pending={pending}
                onConfirm={() => { saveExisting(entry.id, entry.name) }}
                onCancel={() => { setNameError(false); setDraft(entry.id, { name: entry.name, value: entry.value }) }}
                onRestore={() => { void run(`row:${entry.id}`, () => restore(entry.id)) }}
                onRemove={() => { setPendingRemove({ id: entry.id, name: entry.name }) }}
              />
            </div>
          )
        })}

        {pendingOrder.map((id) => {
          const draft = drafts[id] ?? { name: '', value: '' }
          const loading = busyTarget === `pending:${id}`
          const nextName = draft.name.trim()
          const canConfirm = NAME_OK.test(nextName) && draft.value !== '' && !taken.has(nextName)
          const selected = selectedIds.has(id)
          return (
            <div
              key={id}
              className={css.row}
              data-env-row={id}
              data-selected={selected ? 'true' : 'false'}
              aria-selected={selected}
              onMouseDown={(event) => { onRowMouseDown(id, event) }}
            >
              <Field
                id={`env-name-${id}`}
                value={draft.name}
                disabled={busy}
                title={draft.name}
                invalid={nameError}
                label={t('field.name')}
                rowSelectGestures
                onChange={(name) => { setNameError(false); setDraft(id, { name }) }}
              />
              <Field
                id={`env-value-${id}`}
                value={draft.value}
                disabled={busy}
                title={draft.value}
                label={t('field.value')}
                rowSelectGestures
                onChange={(value) => { setDraft(id, { value }) }}
              />
              <RowActions
                t={t}
                busy={busy}
                loading={loading}
                dirty
                canConfirm={canConfirm}
                showRemove={false}
                onConfirm={() => { savePending(id) }}
                onCancel={() => { setNameError(false); dropPending(id) }}
                onRestore={() => undefined}
                onRemove={() => undefined}
              />
            </div>
          )
        })}

        <div className={css.row} data-composer="true">
          <Field
            id="env-new-name"
            value={composer.name}
            disabled={busy}
            placeholder={t('field.namePlaceholder')}
            title={composer.name || t('field.namePlaceholder')}
            label={t('field.name')}
            onChange={(name) => { typeIntoComposer({ name }, 'name') }}
            onPaste={onComposerPaste}
          />
          <Field
            id="env-new-value"
            value={composer.value}
            disabled={busy}
            placeholder={t('field.valuePlaceholder')}
            title={composer.value || t('field.valuePlaceholder')}
            label={t('field.value')}
            onChange={(value) => { typeIntoComposer({ value }, 'value') }}
            onPaste={onComposerPaste}
          />
          <div className={css.actions} aria-hidden="true" />
        </div>
      </div>

      <Modal
        open={pendingRemove !== undefined}
        onClose={() => { if (!busy) setPendingRemove(undefined) }}
        title={t('action.removeConfirmTitle')}
        closeLabel={t('action.close')}
        description={pendingRemove ? t('action.removeConfirm', { name: pendingRemove.name }) : undefined}
        footer={(
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setPendingRemove(undefined) }}>{t('action.cancel')}</Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                if (pendingRemove === undefined || busyTarget !== undefined) return
                const { id } = pendingRemove
                setPendingRemove(undefined)
                void run(`row:${id}`, () => remove(id))
              }}
            >
              {t('action.remove')}
            </Button>
          </>
        )}
      />
    </div>
  )
}

export type { EnvSettingsKey }
