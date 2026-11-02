/** Settings section: `$DSH_HOME/.env` editor + global `dsh` path. */

import {
  useCallback, useEffect, useRef, useState,
  type ClipboardEvent, type MouseEvent, type ReactNode,
} from 'react'
import {
  Button,
  Checkbox,
  IconCheckOutlineRegular,
  IconChevronDownOutlineRegular,
  IconCloseOutlineRegular,
  IconEditOutlineRegular,
  IconFolderOpenOutlineRegular,
  IconLinkOutlineRegular,
  IconLoadingOutlineRegular,
  IconPlusOutlineRegular,
  IconRefreshOutlineRegular,
  IconTrashOutlineRegular,
  IconWarningOutlineRegular,
  Input,
  Menu,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { CliStatus, EnvEntry, EnvGroup, EnvSnapshot } from '../types.ts'
import { DEFAULT_GROUP_ID } from '../group-ids.ts'
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
  readonly upsert: (id: string, name: string, value: string, groupId?: string) => Promise<EnvSnapshot>
  readonly remove: (id: string) => Promise<EnvSnapshot>
  readonly restore: (id: string) => Promise<EnvSnapshot>
  readonly moveEntry: (id: string, groupId: string) => Promise<EnvSnapshot>
  readonly createGroup: (title: string) => Promise<EnvGroup>
  readonly renameGroup: (id: string, title: string) => Promise<EnvGroup>
  readonly deleteGroup: (id: string, moveToDefault: boolean) => Promise<EnvSnapshot>
  readonly cliStatus: () => Promise<CliStatus>
  readonly cliInstall: () => Promise<CliStatus>
}

export type EnvSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.env'>
  & InjectFace<EnvSettingsInjected>

const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u
const PENDING_PREFIX = 'pending:'
const COMPOSER_PREFIX = 'composer:'

type BusyTarget = 'boot' | 'cli' | `row:${string}` | `pending:${string}` | 'group'
type Translate = EnvSettingsSectionProps['t']
interface Draft { name: string; value: string }

function isPendingId(id: string): boolean {
  return id.startsWith(PENDING_PREFIX)
}

function composerId(groupId: string): string {
  return `${COMPOSER_PREFIX}${groupId}`
}

function isComposerId(id: string): boolean {
  return id.startsWith(COMPOSER_PREFIX)
}

/** Split saved rows and pending drafts by group id (unknown → default). */
function rowsByGroup(
  groups: readonly EnvGroup[],
  entries: readonly EnvEntry[],
  pendingOrder: readonly string[],
  pendingGroup: Readonly<Record<string, string>>,
): { readonly saved: ReadonlyMap<string, EnvEntry[]>; readonly pending: ReadonlyMap<string, string[]> } {
  const saved = new Map<string, EnvEntry[]>(groups.map(group => [group.id, []]))
  const pending = new Map<string, string[]>(groups.map(group => [group.id, []]))
  for (const entry of entries) {
    (saved.get(saved.has(entry.groupId) ? entry.groupId : DEFAULT_GROUP_ID) ?? saved.get(DEFAULT_GROUP_ID)!).push(entry)
  }
  for (const id of pendingOrder) {
    const groupId = pendingGroup[id] ?? DEFAULT_GROUP_ID
    ;(pending.get(pending.has(groupId) ? groupId : DEFAULT_GROUP_ID) ?? pending.get(DEFAULT_GROUP_ID)!).push(id)
  }
  return { saved, pending }
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

/** Slots: confirm|restart · cancel|restore|move · delete. */
function RowActions({
  t, busy, loading, dirty, canConfirm, pending = false, showRemove = true,
  moveItems, onConfirm, onCancel, onRestore, onRemove, onMove,
}: {
  t: Translate
  busy: boolean
  loading: boolean
  dirty: boolean
  canConfirm: boolean
  pending?: boolean
  showRemove?: boolean
  moveItems?: readonly { id: string; label: string }[]
  onConfirm: () => void
  onCancel: () => void
  onRestore: () => void
  onRemove: () => void
  onMove?: (groupId: string) => void
}): ReactNode {
  const [moveOpen, setMoveOpen] = useState(false)
  const showMove = !dirty && moveItems !== undefined && moveItems.length > 0 && onMove !== undefined
  return (
    <div className={css.actions} role="group" aria-label={t('field.actions')}>
      <Slot empty={!dirty && !pending && !showMove}>
        {dirty ? (
          <IconAction label={loading ? t('panel.loading') : t('action.confirm')} primary disabled={busy || !canConfirm} onClick={onConfirm}>
            {loading ? <IconLoadingOutlineRegular className={css.spinner} size={14} /> : <IconCheckOutlineRegular size={14} />}
          </IconAction>
        ) : showMove ? (
          <Menu
            open={moveOpen}
            onClose={() => { setMoveOpen(false) }}
            items={moveItems.map(item => ({ id: item.id, label: item.label }))}
            onSelect={(groupId) => {
              setMoveOpen(false)
              onMove(groupId)
            }}
            align="end"
            portal
            anchor={(
              <IconAction label={t('action.moveGroup')} disabled={busy} onClick={() => { setMoveOpen(value => !value) }}>
                <IconFolderOpenOutlineRegular size={14} />
              </IconAction>
            )}
          />
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
  t, load, upsert, remove, restore, moveEntry, createGroup, renameGroup, deleteGroup, cliStatus, cliInstall,
}: EnvSettingsSectionProps) {
  const [snapshot, setSnapshot] = useState<EnvSnapshot | undefined>()
  const [cli, setCli] = useState<CliStatus | undefined>()
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [pendingOrder, setPendingOrder] = useState<string[]>([])
  const [pendingGroup, setPendingGroup] = useState<Record<string, string>>({})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ [DEFAULT_GROUP_ID]: true })
  const [busyTarget, setBusyTarget] = useState<BusyTarget | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [nameError, setNameError] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | undefined>()
  const [groupModal, setGroupModal] = useState<
    | { kind: 'create' }
    | { kind: 'rename'; id: string; title: string }
    | { kind: 'delete'; id: string; title: string; moveToDefault: boolean }
    | undefined
  >()
  const [groupTitleDraft, setGroupTitleDraft] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const pendingSeq = useRef(0)
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const pendingOrderRef = useRef(pendingOrder)
  pendingOrderRef.current = pendingOrder
  const pendingGroupRef = useRef(pendingGroup)
  pendingGroupRef.current = pendingGroup
  const selectedRef = useRef(selectedIds)
  selectedRef.current = selectedIds
  const anchorIdRef = useRef<string | undefined>(undefined)
  const dragModeRef = useRef<'range' | 'toggle' | undefined>(undefined)
  const dragVisitedRef = useRef<Set<string>>(new Set())
  const dragPendingCrossRef = useRef(false)
  const pendingRemoveRef = useRef(pendingRemove)
  pendingRemoveRef.current = pendingRemove
  const groupModalRef = useRef(groupModal)
  groupModalRef.current = groupModal

  const busy = busyTarget !== undefined
  const groups = snapshot?.groups ?? [{ id: DEFAULT_GROUP_ID, title: t('group.defaultTitle') }]
  const entries = snapshot?.entries ?? []
  const taken = new Set(entries.map(entry => entry.name))
  const grouped = rowsByGroup(groups, entries, pendingOrder, pendingGroup)
  const selectableOrder = groups.flatMap(group => [
    ...(grouped.saved.get(group.id) ?? []).map(entry => entry.id),
    ...(grouped.pending.get(group.id) ?? []),
  ])
  const selectableOrderRef = useRef(selectableOrder)
  selectableOrderRef.current = selectableOrder

  const groupLabel = (group: EnvGroup): string =>
    group.id === DEFAULT_GROUP_ID ? t('group.defaultTitle') : group.title

  const keepTransientDrafts = (
    current: Record<string, Draft>,
    dropId?: string,
  ): Record<string, Draft> => {
    const kept: Record<string, Draft> = {}
    for (const [id, draft] of Object.entries(current)) {
      if (isComposerId(id)) kept[id] = draft
      else if (isPendingId(id) && id !== dropId) kept[id] = draft
    }
    return kept
  }

  const emptyComposers = (nextGroups: readonly EnvGroup[], current: Record<string, Draft>): Record<string, Draft> =>
    Object.fromEntries(nextGroups.map(group => {
      const id = composerId(group.id)
      return [id, current[id] ?? { name: '', value: '' }]
    }))

  const forgetPendingId = (id: string): void => {
    setPendingOrder(order => order.filter(item => item !== id))
    setPendingGroup((previous) => {
      if (previous[id] === undefined) return previous
      const next = { ...previous }
      delete next[id]
      return next
    })
    setSelectedIds(previous => {
      if (!previous.has(id)) return previous
      const next = new Set(previous)
      next.delete(id)
      return next
    })
    if (anchorIdRef.current === id) anchorIdRef.current = undefined
  }

  const applySnapshot = (next: EnvSnapshot, dropPendingId?: string): void => {
    setSnapshot(next)
    setOpenGroups((previous) => {
      const merged = { ...previous }
      for (const group of next.groups) {
        if (merged[group.id] === undefined) merged[group.id] = group.id === DEFAULT_GROUP_ID
      }
      return merged
    })
    if (dropPendingId !== undefined) forgetPendingId(dropPendingId)
    setDrafts(current => ({
      ...emptyComposers(next.groups, current),
      ...keepTransientDrafts(current, dropPendingId),
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
    forgetPendingId(id)
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
      setPendingGroup({})
      clearSelection()
      const next = await load()
      setSnapshot(next)
      setOpenGroups(Object.fromEntries(next.groups.map(group => [group.id, group.id === DEFAULT_GROUP_ID])))
      setDrafts({
        ...emptyComposers(next.groups, {}),
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
    pruneSelection(new Set(selectableOrder))
  }, [selectableOrder.join('\0')])

  const stopEditingGesture = (): void => {
    clearDomTextSelection()
    const active = document.activeElement
    if (active instanceof HTMLInputElement && active.closest(`.${css.groups}`) !== null) active.blur()
  }

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
      if (selectedRef.current.size === 0 || pendingRemoveRef.current !== undefined || groupModalRef.current !== undefined) return
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
    const groupId = pendingGroup[id] ?? DEFAULT_GROUP_ID
    void run(`pending:${id}`, () => upsert('', name, draft.value, groupId), id)
  }

  const typeIntoComposer = (groupId: string, patch: Partial<Draft>, focus: 'name' | 'value'): void => {
    setNameError(false)
    const key = composerId(groupId)
    const base = draftsRef.current[key] ?? { name: '', value: '' }
    const next = { name: patch.name ?? base.name, value: patch.value ?? base.value }
    const id = `${PENDING_PREFIX}${++pendingSeq.current}`
    setDrafts(previous => ({
      ...previous,
      [id]: next,
      [key]: { name: '', value: '' },
    }))
    setPendingOrder(order => [...order, id])
    setPendingGroup(previous => ({ ...previous, [id]: groupId }))
    queueMicrotask(() => {
      document.getElementById(`env-${focus}-${id}`)?.focus()
    })
  }

  const appendPendingPairs = (groupId: string, pairs: readonly { name: string; value: string }[]): void => {
    if (pairs.length === 0) return
    setNameError(false)
    const previous = draftsRef.current
    const order = pendingOrderRef.current
    const groupsByPending = pendingGroupRef.current
    const nextDrafts = { ...previous, [composerId(groupId)]: { name: '', value: '' } }
    const existingPendingByName = new Map<string, string>()
    for (const id of order) {
      const draft = previous[id]
      if (draft !== undefined) existingPendingByName.set(draft.name.trim(), id)
    }
    const savedByName = new Map(entries.map(entry => [entry.name, entry.id]))
    const added: string[] = []
    const dropPendingIds = new Set<string>()
    const nextPendingGroup = { ...groupsByPending }
    for (const pair of pairs) {
      const savedId = savedByName.get(pair.name)
      if (savedId !== undefined) {
        nextDrafts[savedId] = { name: pair.name, value: pair.value }
        const pendingDup = existingPendingByName.get(pair.name)
        if (pendingDup !== undefined) {
          delete nextDrafts[pendingDup]
          dropPendingIds.add(pendingDup)
          delete nextPendingGroup[pendingDup]
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
      nextPendingGroup[id] = groupId
      added.push(id)
    }
    setDrafts(nextDrafts)
    setPendingGroup(nextPendingGroup)
    if (added.length > 0 || dropPendingIds.size > 0) {
      setPendingOrder([...order.filter(id => !dropPendingIds.has(id)), ...added])
    }
  }

  const onComposerPaste = (groupId: string, event: ClipboardEvent<HTMLInputElement>): void => {
    const text = event.clipboardData.getData('text')
    const pairs = parseEnvPaste(text)
    if (pairs.length === 0) return
    event.preventDefault()
    appendPendingPairs(groupId, pairs)
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

    if (!onInput && !onControl) event.preventDefault()
    anchorIdRef.current = id
    dragModeRef.current = 'range'
    dragVisitedRef.current = new Set([id])
    dragPendingCrossRef.current = true
  }

  const submitGroupModal = (): void => {
    if (groupModal === undefined || busyTarget !== undefined) return
    if (groupModal.kind === 'create' || groupModal.kind === 'rename') {
      const title = groupTitleDraft.trim()
      if (title === '') return
      setBusyTarget('group')
      setError(undefined)
      void (async () => {
        try {
          if (groupModal.kind === 'create') {
            const group = await createGroup(title)
            const next = await load()
            applySnapshot(next)
            setOpenGroups(previous => ({ ...previous, [group.id]: true }))
          } else {
            await renameGroup(groupModal.id, title)
            applySnapshot(await load())
          }
          setGroupModal(undefined)
        } catch (err) {
          setError(formatRemoteError(err, t))
        } finally {
          setBusyTarget(undefined)
        }
      })()
      return
    }
    setBusyTarget('group')
    setError(undefined)
    void (async () => {
      try {
        applySnapshot(await deleteGroup(groupModal.id, groupModal.moveToDefault))
        setGroupModal(undefined)
      } catch (err) {
        setError(formatRemoteError(err, t))
      } finally {
        setBusyTarget(undefined)
      }
    })()
  }

  const cliInstalling = busyTarget === 'cli'
  const cliBooting = busyTarget === 'boot' || cli === undefined
  const showCliAction = cli?.canInstall === true || cliInstalling
  const notice = error
    ?? (nameError ? t('error.invalidName') : undefined)
    ?? (cli?.reason === 'could-not-resolve-expected-cli' ? t('error.cliUnresolved') : undefined)
    ?? (cli?.reason === 'unsupported-platform' ? t('error.cliUnsupported') : undefined)

  const moveTargets = (currentGroupId: string): { id: string; label: string }[] =>
    groups
      .filter(group => group.id !== currentGroupId)
      .map(group => ({ id: group.id, label: groupLabel(group) }))

  const renderRow = (entry: EnvEntry): ReactNode => {
    const draft = drafts[entry.id] ?? { name: entry.name, value: entry.value }
    const dirty = draft.name !== entry.name || draft.value !== entry.value
    const pendingKind = entry.kind === 'added' || entry.kind === 'modified'
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
          pending={pendingKind && !dirty ? true : false}
          moveItems={moveTargets(entry.groupId)}
          onConfirm={() => { saveExisting(entry.id, entry.name) }}
          onCancel={() => { setNameError(false); setDraft(entry.id, { name: entry.name, value: entry.value }) }}
          onRestore={() => { void run(`row:${entry.id}`, () => restore(entry.id)) }}
          onRemove={() => { setPendingRemove({ id: entry.id, name: entry.name }) }}
          onMove={(groupId) => { void run(`row:${entry.id}`, () => moveEntry(entry.id, groupId)) }}
        />
      </div>
    )
  }

  const renderPending = (id: string, groupId: string): ReactNode => {
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
  }

  const renderComposer = (groupId: string): ReactNode => {
    const key = composerId(groupId)
    const composer = drafts[key] ?? { name: '', value: '' }
    return (
      <div className={css.row} data-composer="true">
        <Field
          id={`env-new-name-${groupId}`}
          value={composer.name}
          disabled={busy}
          placeholder={t('field.namePlaceholder')}
          title={composer.name || t('field.namePlaceholder')}
          label={t('field.name')}
          onChange={(name) => { typeIntoComposer(groupId, { name }, 'name') }}
          onPaste={(event) => { onComposerPaste(groupId, event) }}
        />
        <Field
          id={`env-new-value-${groupId}`}
          value={composer.value}
          disabled={busy}
          placeholder={t('field.valuePlaceholder')}
          title={composer.value || t('field.valuePlaceholder')}
          label={t('field.value')}
          onChange={(value) => { typeIntoComposer(groupId, { value }, 'value') }}
          onPaste={(event) => { onComposerPaste(groupId, event) }}
        />
        <div className={css.actions} aria-hidden="true" />
      </div>
    )
  }

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

      <div className={css.groups}>
        {groups.map((group) => {
          const expanded = openGroups[group.id] === true
          const groupEntries = grouped.saved.get(group.id) ?? []
          const groupPending = grouped.pending.get(group.id) ?? []
          const isDefault = group.id === DEFAULT_GROUP_ID
          return (
            <section key={group.id} className={css.group}>
              <div className={css.groupTitleRow}>
                <button
                  type="button"
                  className={css.groupToggle}
                  aria-expanded={expanded}
                  onClick={() => {
                    setOpenGroups(previous => ({ ...previous, [group.id]: !expanded }))
                  }}
                >
                  <IconChevronDownOutlineRegular className={css.chevron} size={12} aria-hidden="true" />
                  <span className={css.groupTitle}>{groupLabel(group)}</span>
                </button>
                <div className={css.headerEnd}>
                  {isDefault ? (
                    <IconAction
                      label={t('action.createGroup')}
                      disabled={busy}
                      onClick={() => {
                        setGroupTitleDraft('')
                        setGroupModal({ kind: 'create' })
                      }}
                    >
                      <IconPlusOutlineRegular size={14} />
                    </IconAction>
                  ) : (
                    <>
                      <IconAction
                        label={t('action.renameGroup')}
                        disabled={busy}
                        onClick={() => {
                          setGroupTitleDraft(group.title)
                          setGroupModal({ kind: 'rename', id: group.id, title: group.title })
                        }}
                      >
                        <IconEditOutlineRegular size={14} />
                      </IconAction>
                      <IconAction
                        label={t('action.deleteGroup')}
                        danger
                        disabled={busy}
                        onClick={() => {
                          setGroupModal({
                            kind: 'delete',
                            id: group.id,
                            title: group.title,
                            moveToDefault: true,
                          })
                        }}
                      >
                        <IconTrashOutlineRegular size={14} />
                      </IconAction>
                    </>
                  )}
                </div>
              </div>
              {expanded ? (
                <div className={css.groupBody}>
                  {isDefault ? (
                    <div className={css.header}>
                      <p className={css.headerLabel}>{t('field.name')}</p>
                      <p className={css.headerLabel}>{t('field.value')}</p>
                      <div className={css.headerActions} aria-hidden="true" />
                    </div>
                  ) : null}
                  {groupEntries.map(entry => renderRow(entry))}
                  {groupPending.map(id => renderPending(id, group.id))}
                  {renderComposer(group.id)}
                </div>
              ) : null}
            </section>
          )
        })}
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

      <Modal
        open={groupModal !== undefined}
        onClose={() => { if (!busy) setGroupModal(undefined) }}
        title={
          groupModal?.kind === 'create' ? t('action.createGroup')
            : groupModal?.kind === 'rename' ? t('action.renameGroup')
              : t('action.deleteGroupTitle')
        }
        closeLabel={t('action.close')}
        description={
          groupModal?.kind === 'delete'
            ? t('action.deleteGroupConfirm', { title: groupModal.title })
            : undefined
        }
        footer={(
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setGroupModal(undefined) }}>{t('action.cancel')}</Button>
            <Button
              variant="primary"
              disabled={busy || ((groupModal?.kind === 'create' || groupModal?.kind === 'rename') && groupTitleDraft.trim() === '')}
              onClick={() => { submitGroupModal() }}
            >
              {groupModal?.kind === 'delete' ? t('action.deleteGroup') : t('action.confirm')}
            </Button>
          </>
        )}
      >
        {groupModal?.kind === 'create' || groupModal?.kind === 'rename' ? (
          <div className={css.modalField}>
            <Input
              value={groupTitleDraft}
              placeholder={t('action.groupTitlePlaceholder')}
              aria-label={t('action.groupTitle')}
              disabled={busy}
              onChange={(event) => { setGroupTitleDraft(event.target.value) }}
            />
          </div>
        ) : null}
        {groupModal?.kind === 'delete' ? (
          <Checkbox
            className={css.modalCheck}
            checked={groupModal.moveToDefault}
            disabled={busy}
            label={t('action.deleteGroupMove')}
            onChange={(checked) => {
              setGroupModal({ ...groupModal, moveToDefault: checked })
            }}
          />
        ) : null}
      </Modal>
    </div>
  )
}

export type { EnvSettingsKey }
