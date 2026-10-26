/** Settings section: `$DSH_HOME/.env` editor + global `dsh` path. */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
import type { EnvSettingsKey } from './locales.ts'
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
const NEW_ID = ''

type BusyTarget = 'boot' | 'cli' | 'new' | `row:${string}`
type Translate = EnvSettingsSectionProps['t']
interface Draft { name: string; value: string }

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
    <div className={css.actions} role="group" aria-label={t('actions')}>
      <Slot empty={!dirty && !pending}>
        {dirty ? (
          <IconAction label={loading ? t('loading') : t('confirm')} primary disabled={busy || !canConfirm} onClick={onConfirm}>
            {loading ? <IconLoadingOutlineRegular className={css.spinner} size={14} /> : <IconCheckOutlineRegular size={14} />}
          </IconAction>
        ) : (
          <Tooltip portal label={t('restartRequired')} side="top" delayMs={400}>
            <span className={css.restartBadge} role="img" aria-label={t('restartRequired')} title={t('restartRequired')}>
              <IconWarningOutlineRegular size={14} />
            </span>
          </Tooltip>
        )}
      </Slot>
      <Slot empty={!dirty && !pending}>
        {dirty ? (
          <IconAction label={t('cancel')} disabled={busy} onClick={onCancel}>
            <IconCloseOutlineRegular size={14} />
          </IconAction>
        ) : (
          <IconAction label={t('restore')} disabled={busy} onClick={onRestore}>
            <IconRefreshOutlineRegular size={14} />
          </IconAction>
        )}
      </Slot>
      <Slot empty={!showRemove}>
        <IconAction label={t('remove')} danger disabled={busy} onClick={onRemove}>
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
  onChange: (value: string) => void
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
        onChange={(event) => { props.onChange(event.target.value) }}
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
  const [drafts, setDrafts] = useState<Record<string, Draft>>({ [NEW_ID]: { name: '', value: '' } })
  const [busyTarget, setBusyTarget] = useState<BusyTarget | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [nameError, setNameError] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | undefined>()

  const busy = busyTarget !== undefined
  const entries = snapshot?.entries ?? []
  const taken = new Set(entries.map(entry => entry.name))

  const applySnapshot = (next: EnvSnapshot): void => {
    setSnapshot(next)
    setDrafts({
      [NEW_ID]: { name: '', value: '' },
      ...Object.fromEntries(next.entries.map(entry => [entry.id, { name: entry.name, value: entry.value }])),
    })
  }

  const setDraft = (id: string, patch: Partial<Draft>): void => {
    setDrafts(previous => ({
      ...previous,
      [id]: { name: patch.name ?? previous[id]?.name ?? '', value: patch.value ?? previous[id]?.value ?? '' },
    }))
  }

  const run = async (target: BusyTarget, action: () => Promise<EnvSnapshot>): Promise<void> => {
    if (busyTarget !== undefined) return
    setBusyTarget(target)
    setError(undefined)
    try {
      applySnapshot(await action())
    } catch {
      setError(t('error'))
    } finally {
      setBusyTarget(undefined)
    }
  }

  const refresh = useCallback(async () => {
    setBusyTarget('boot')
    setError(undefined)
    try {
      applySnapshot(await load())
      try { setCli(await cliStatus()) } catch { setCli(undefined) }
    } catch {
      setError(t('error'))
    } finally {
      setBusyTarget(undefined)
    }
  }, [load, cliStatus, t])

  useEffect(() => { void refresh() }, [refresh])

  const saveRow = (id: string, entryName: string | undefined): void => {
    const draft = drafts[id] ?? { name: '', value: '' }
    const name = draft.name.trim()
    const takenByOther = name !== entryName && taken.has(name)
    if (!NAME_OK.test(name) || takenByOther) {
      setNameError(true)
      return
    }
    if (draft.value === '') return
    setNameError(false)
    const target: BusyTarget = id === NEW_ID ? 'new' : `row:${id}`
    void run(target, () => upsert(id, name, draft.value))
  }

  const newDraft = drafts[NEW_ID] ?? { name: '', value: '' }
  const newDirty = newDraft.name.trim() !== '' || newDraft.value !== ''
  const cliInstalling = busyTarget === 'cli'
  const cliBooting = busyTarget === 'boot' || cli === undefined
  const showCliAction = cli?.canInstall === true || cliInstalling
  const notice = error
    ?? (nameError ? t('invalidName') : undefined)
    ?? (cli?.reason === 'could-not-resolve-expected-cli' ? t('cliReasonUnresolved') : undefined)
    ?? (cli?.reason === 'unsupported-platform' ? t('cliReasonUnsupported') : undefined)

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('title')}</h2>

      <section className={css.cli} aria-label={t('cliTitle')}>
        <h3 className={css.cliHeading}>{t('cliTitle')}</h3>
        <div className={css.cliBody}>
          <p
            className={css.cliPath}
            title={cliBooting ? undefined : (cli.activePath ?? undefined)}
            aria-busy={cliBooting || cliInstalling}
          >
            {cliBooting ? t('loading') : cli.activePath === null ? t('cliActiveMissing') : cli.activePath}
          </p>
          <div className={css.cliSlot} data-empty={showCliAction ? 'false' : 'true'}>
            {showCliAction ? (
              <IconAction
                label={cliInstalling ? t('loading') : cli?.platform === 'darwin' ? t('cliMacConflict') : t('cliInstall')}
                disabled={busy}
                onClick={() => {
                  if (busyTarget !== undefined) return
                  setBusyTarget('cli')
                  setError(undefined)
                  void (async () => {
                    try { setCli(await cliInstall()) }
                    catch { setError(t('cliInstallError')) }
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
          <p className={css.headerLabel}>{t('name')}</p>
          <p className={css.headerLabel}>{t('value')}</p>
          <div className={css.headerActions} aria-hidden="true" />
        </div>

        {snapshot !== undefined && entries.length === 0 && notice === undefined
          ? <p className={css.empty}>{t('empty')}</p>
          : null}

        {entries.map((entry: EnvEntry) => {
          const draft = drafts[entry.id] ?? { name: entry.name, value: entry.value }
          const dirty = draft.name !== entry.name || draft.value !== entry.value
          const pending = entry.kind === 'added' || entry.kind === 'modified'
          const loading = busyTarget === `row:${entry.id}`
          const nextName = draft.name.trim()
          const canConfirm = NAME_OK.test(nextName) && draft.value !== '' && !(nextName !== entry.name && taken.has(nextName))
          return (
            <div key={entry.id} className={css.row}>
              <Field
                id={`env-name-${entry.id}`}
                value={draft.name}
                disabled={busy}
                title={draft.name}
                invalid={nameError && dirty}
                label={t('name')}
                onChange={(name) => { setNameError(false); setDraft(entry.id, { name }) }}
              />
              <Field
                id={`env-value-${entry.id}`}
                value={draft.value}
                disabled={busy}
                title={draft.value}
                label={t('value')}
                onChange={(value) => { setDraft(entry.id, { value }) }}
              />
              <RowActions
                t={t}
                busy={busy}
                loading={loading}
                dirty={dirty || loading}
                canConfirm={canConfirm}
                pending={pending}
                onConfirm={() => { saveRow(entry.id, entry.name) }}
                onCancel={() => { setNameError(false); setDraft(entry.id, { name: entry.name, value: entry.value }) }}
                onRestore={() => { void run(`row:${entry.id}`, () => restore(entry.id)) }}
                onRemove={() => { setPendingRemove({ id: entry.id, name: entry.name }) }}
              />
            </div>
          )
        })}

        <div className={css.row}>
          <Field
            id="env-new-name"
            value={newDraft.name}
            disabled={busy}
            placeholder={t('namePlaceholder')}
            title={newDraft.name || t('namePlaceholder')}
            invalid={nameError}
            label={t('name')}
            onChange={(name) => { setNameError(false); setDraft(NEW_ID, { name }) }}
          />
          <Field
            id="env-new-value"
            value={newDraft.value}
            disabled={busy}
            placeholder={t('valuePlaceholder')}
            title={newDraft.value || t('valuePlaceholder')}
            label={t('value')}
            onChange={(value) => { setDraft(NEW_ID, { value }) }}
          />
          <RowActions
            t={t}
            busy={busy}
            loading={busyTarget === 'new'}
            dirty={newDirty || busyTarget === 'new'}
            canConfirm={NAME_OK.test(newDraft.name.trim()) && newDraft.value !== '' && !taken.has(newDraft.name.trim())}
            showRemove={false}
            onConfirm={() => { saveRow(NEW_ID, undefined) }}
            onCancel={() => { setNameError(false); setDraft(NEW_ID, { name: '', value: '' }) }}
            onRestore={() => undefined}
            onRemove={() => undefined}
          />
        </div>
      </div>

      <Modal
        open={pendingRemove !== undefined}
        onClose={() => { if (!busy) setPendingRemove(undefined) }}
        title={t('removeConfirmTitle')}
        closeLabel={t('close')}
        description={pendingRemove ? t('removeConfirm', { name: pendingRemove.name }) : undefined}
        footer={(
          <>
            <Button variant="outline" disabled={busy} onClick={() => { setPendingRemove(undefined) }}>{t('cancel')}</Button>
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
              {t('remove')}
            </Button>
          </>
        )}
      />
    </div>
  )
}

export type { EnvSettingsKey }
