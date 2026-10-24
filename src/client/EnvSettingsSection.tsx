/** Settings section: list / upsert / remove `$DSH_HOME/.env` entries. */

import { useCallback, useEffect, useState } from 'react'
import { Button, Input } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { EnvEntry, EnvSnapshot } from '../types.ts'
import type { EnvSettingsKey } from './locales.ts'
import css from './EnvSettingsSection.module.css'

/** Callbacks injected from the Client apply closure. */
export interface EnvSettingsInjected {
  /** Load the current snapshot from the Host. */
  readonly load: () => Promise<EnvSnapshot>
  /** Create or replace one entry. */
  readonly upsert: (name: string, value: string) => Promise<EnvSnapshot>
  /** Delete one entry. */
  readonly remove: (name: string) => Promise<EnvSnapshot>
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
export function EnvSettingsSection({ t, load, upsert, remove }: EnvSettingsSectionProps) {
  const [snapshot, setSnapshot] = useState<EnvSnapshot | undefined>()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [nameError, setNameError] = useState(false)

  const refresh = useCallback(async () => {
    setBusy(true)
    setError(undefined)
    try {
      const next = await load()
      setSnapshot(next)
      const nextDrafts: Record<string, string> = {}
      for (const entry of next.entries) nextDrafts[entry.name] = entry.value
      setDrafts(nextDrafts)
    } catch (_error) {
      setError(t('error'))
    } finally {
      setBusy(false)
    }
  }, [load, t])

  useEffect(() => { void refresh() }, [refresh])

  const run = async (action: () => Promise<EnvSnapshot>): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      const next = await action()
      setSnapshot(next)
      const nextDrafts: Record<string, string> = {}
      for (const entry of next.entries) nextDrafts[entry.name] = entry.value
      setDrafts(nextDrafts)
    } catch (_error) {
      setError(t('error'))
    } finally {
      setBusy(false)
    }
  }

  const onAdd = (): void => {
    const name = newName.trim()
    if (!NAME_OK.test(name)) {
      setNameError(true)
      return
    }
    setNameError(false)
    void run(async () => {
      const next = await upsert(name, newValue)
      setNewName('')
      setNewValue('')
      return next
    })
  }

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{t('title')}</h2>
      <p className={css.intro}>{t('intro')}</p>
      {snapshot !== undefined && <p className={css.path}>{t('path', { path: snapshot.path })}</p>}
      <p className={css.hint}>{t('osSync')}</p>
      {error !== undefined && <p className={css.status} data-tone="error" role="status">{error}</p>}
      {snapshot === undefined && busy ? <p className={css.status}>{t('loading')}</p> : null}
      {snapshot !== undefined && snapshot.entries.length === 0 ? <p className={css.empty}>{t('empty')}</p> : null}
      {snapshot !== undefined && snapshot.entries.length > 0 ? (
        <ul className={css.list}>
          {snapshot.entries.map((entry: EnvEntry) => (
            <li key={entry.name} className={css.row}>
              <div className={css.field}>
                <label>{t('name')}</label>
                <Input value={entry.name} disabled readOnly aria-label={t('name')} />
              </div>
              <div className={css.field}>
                <label htmlFor={`env-value-${entry.name}`}>{t('value')}</label>
                <Input
                  id={`env-value-${entry.name}`}
                  value={drafts[entry.name] ?? entry.value}
                  disabled={busy}
                  aria-label={t('value')}
                  onChange={(event) => {
                    const value = event.target.value
                    setDrafts(previous => ({ ...previous, [entry.name]: value }))
                  }}
                />
              </div>
              <div className={css.actions}>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || (drafts[entry.name] ?? entry.value) === entry.value}
                  onClick={() => { void run(() => upsert(entry.name, drafts[entry.name] ?? entry.value)) }}
                >
                  {t('save')}
                </Button>
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
          ))}
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
        <Button variant="primary" disabled={busy || newName.trim() === ''} onClick={onAdd}>{t('add')}</Button>
      </div>
      {nameError ? <p className={css.status} data-tone="error" role="status">{t('invalidName')}</p> : null}
    </div>
  )
}

export type { EnvSettingsKey }
