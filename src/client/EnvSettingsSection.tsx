/** Settings section: draft confirm/cancel for `$DSH_HOME/.env` + CLI PATH status. */

import { useCallback, useEffect, useState } from 'react'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { CliStatus, EnvEntry, EnvSnapshot } from '../types.ts'
import type { EnvSettingsKey } from './locales.ts'
import css from './EnvSettingsSection.module.css'

/** Callbacks injected from the Client apply closure. */
export interface EnvSettingsInjected {
  /** Load the current snapshot from the Host. */
  readonly load: () => Promise<EnvSnapshot>
  /** Create or replace one entry (Confirm only). */
  readonly upsert: (name: string, value: string) => Promise<EnvSnapshot>
  /** Delete one entry. */
  readonly remove: (name: string) => Promise<EnvSnapshot>
  /** Write a modified entry back to the Host-start baseline. */
  readonly restore: (name: string) => Promise<EnvSnapshot>
  /** Load CLI PATH comparison for this Host. */
  readonly cliStatus: () => Promise<CliStatus>
  /** Install expected CLI onto user PATH / macOS symlink. */
  readonly cliInstall: () => Promise<CliStatus>
}

/** Props bound by the slot renderer. */
export type EnvSettingsSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'settings.env'>
  & InjectFace<EnvSettingsInjected>

const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u

/**
 * Render the environment-variables settings page.
 * @param props - locale `t` and Host remote callbacks.
 */
export function EnvSettingsSection({
  t, load, upsert, remove, restore, cliStatus, cliInstall,
}: EnvSettingsSectionProps) {
  const [snapshot, setSnapshot] = useState<EnvSnapshot | undefined>()
  const [cli, setCli] = useState<CliStatus | undefined>()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [cliNotice, setCliNotice] = useState<string | undefined>()
  const [nameError, setNameError] = useState(false)

  const applySnapshot = (next: EnvSnapshot): void => {
    setSnapshot(next)
    const nextDrafts: Record<string, string> = {}
    for (const entry of next.entries) nextDrafts[entry.name] = entry.value
    setDrafts(nextDrafts)
  }

  const refreshCli = useCallback(async () => {
    try {
      setCli(await cliStatus())
    } catch {
      setCli(undefined)
    }
  }, [cliStatus])

  const refresh = useCallback(async () => {
    setBusy(true)
    setError(undefined)
    try {
      applySnapshot(await load())
      await refreshCli()
    } catch {
      setError(t('error'))
    } finally {
      setBusy(false)
    }
  }, [load, refreshCli, t])

  useEffect(() => { void refresh() }, [refresh])

  const run = async (action: () => Promise<EnvSnapshot>): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      applySnapshot(await action())
    } catch {
      setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  const newNameTrimmed = newName.trim()
  const newDraftDirty = newNameTrimmed !== '' || newValue !== ''
  const newCanConfirm = NAME_OK.test(newNameTrimmed) && newValue !== ''

  const onConfirmNew = (): void => {
    if (!NAME_OK.test(newNameTrimmed)) {
      setNameError(true)
      return
    }
    if (newValue === '') return
    setNameError(false)
    void run(async () => {
      const next = await upsert(newNameTrimmed, newValue)
      setNewName('')
      setNewValue('')
      return next
    })
  }

  const onCancelNew = (): void => {
    setNewName('')
    setNewValue('')
    setNameError(false)
  }

  const onInstallCli = (): void => {
    setBusy(true)
    setError(undefined)
    setCliNotice(undefined)
    void (async () => {
      try {
        setCli(await cliInstall())
        setCliNotice(t('cliInstallOk'))
      } catch {
        setError(t('cliInstallError'))
      } finally {
        setBusy(false)
      }
    })()
  }

  const cliReasonCopy = (status: CliStatus): string | undefined => {
    if (status.reason === 'could-not-resolve-expected-cli') return t('cliReasonUnresolved')
    if (status.reason === 'unsupported-platform') return t('cliReasonUnsupported')
    return undefined
  }

  const pendingTip = (entry: EnvEntry): string | undefined => {
    if (entry.kind === 'added') return t('restartRequiredAdded')
    if (entry.kind === 'modified') return t('restartRequired')
    return undefined
  }

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>
      {snapshot !== undefined && <p className={css.path}>{t('path', { path: snapshot.path })}</p>}
      <p className={css.hint}>{t('osSync')}</p>

      <div className={css.cli}>
        <h3 className={css.cliHeading}>{t('cliTitle')}</h3>
        <p className={css.hint}>{t('cliIntro')}</p>
        {cli === undefined && busy ? <p className={css.status}>{t('loading')}</p> : null}
        {cli !== undefined ? (
          <>
            <p className={css.path}>
              {cli.activePath === null ? t('cliActiveMissing') : t('cliActive', { path: cli.activePath })}
            </p>
            <p className={css.path}>
              {cli.expectedPath === null ? t('cliExpectedMissing') : t('cliExpected', { path: cli.expectedPath })}
            </p>
            {cli.matches ? <p className={css.hint}>{t('cliMatches')}</p> : null}
            {cliReasonCopy(cli) !== undefined ? <p className={css.hint}>{cliReasonCopy(cli)}</p> : null}
            {cli.canInstall ? (
              <div className={css.cliActions}>
                <p className={css.hint}>{t('cliInstallHint')}</p>
                {cli.platform === 'darwin' ? <p className={css.hint}>{t('cliMacConflict')}</p> : null}
                <Button variant="primary" size="sm" disabled={busy} onClick={onInstallCli}>
                  {t('cliInstall')}
                </Button>
              </div>
            ) : null}
            {cliNotice !== undefined ? <p className={css.status} data-tone="ok" role="status">{cliNotice}</p> : null}
          </>
        ) : null}
      </div>

      {error !== undefined && <p className={css.status} data-tone="error" role="status">{error}</p>}
      {snapshot === undefined && busy ? <p className={css.status}>{t('loading')}</p> : null}
      {snapshot !== undefined && snapshot.entries.length === 0 ? <p className={css.empty}>{t('empty')}</p> : null}
      {snapshot !== undefined && snapshot.entries.length > 0 ? (
        <ul className={css.list}>
          {snapshot.entries.map((entry: EnvEntry) => {
            const draft = drafts[entry.name] ?? entry.value
            const dirty = draft !== entry.value
            const tip = pendingTip(entry)
            return (
              <li key={entry.name} className={css.row}>
                <div className={css.field}>
                  <label>{t('name')}</label>
                  <Input value={entry.name} disabled readOnly aria-label={t('name')} />
                </div>
                <div className={css.field}>
                  <label htmlFor={`env-value-${entry.name}`}>{t('value')}</label>
                  <Input
                    id={`env-value-${entry.name}`}
                    value={draft}
                    disabled={busy}
                    aria-label={t('value')}
                    onChange={(event) => {
                      const value = event.target.value
                      setDrafts(previous => ({ ...previous, [entry.name]: value }))
                    }}
                  />
                  {tip !== undefined && !dirty ? (
                    <p className={css.pending} role="status">{tip}</p>
                  ) : null}
                </div>
                <div className={css.actions}>
                  {dirty ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busy || draft === ''}
                        onClick={() => { void run(() => upsert(entry.name, draft)) }}
                      >
                        {t('confirm')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setDrafts(previous => ({ ...previous, [entry.name]: entry.value }))
                        }}
                      >
                        {t('cancel')}
                      </Button>
                    </>
                  ) : null}
                  {entry.kind === 'modified' && !dirty ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => { void run(() => restore(entry.name)) }}
                    >
                      {t('restore')}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => { void run(() => remove(entry.name)) }}
                  >
                    {t('remove')}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
      <div className={css.add}>
        <div className={css.field}>
          <label htmlFor="env-new-name">{t('name')}</label>
          <Input
            id="env-new-name"
            value={newName}
            disabled={busy}
            placeholder={t('namePlaceholder')}
            aria-invalid={nameError || undefined}
            onChange={(event) => {
              setNewName(event.target.value)
              setNameError(false)
            }}
          />
        </div>
        <div className={css.field}>
          <label htmlFor="env-new-value">{t('value')}</label>
          <Input
            id="env-new-value"
            value={newValue}
            disabled={busy}
            placeholder={t('valuePlaceholder')}
            onChange={(event) => { setNewValue(event.target.value) }}
          />
        </div>
        <div className={css.actions}>
          {newDraftDirty ? (
            <>
              <Button variant="primary" disabled={busy || !newCanConfirm} onClick={onConfirmNew}>
                {t('confirm')}
              </Button>
              <Button variant="outline" disabled={busy} onClick={onCancelNew}>
                {t('cancel')}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {nameError ? <p className={css.status} data-tone="error" role="status">{t('invalidName')}</p> : null}
    </div>
  )
}

export type { EnvSettingsKey }
