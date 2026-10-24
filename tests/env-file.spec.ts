import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWritableEnvName } from '../src/names.ts'
import { listEnvEntries, loadEnvMap, removeEnvEntry, upsertEnvEntry } from '../src/env-file.ts'

describe('isWritableEnvName', () => {
  it('accepts ordinary names', () => {
    expect(isWritableEnvName('FOO_BAR')).toBe(true)
  })

  it('rejects bootstrap names and prefixes', () => {
    expect(isWritableEnvName('PATH')).toBe(false)
    expect(isWritableEnvName('DSH_HOME')).toBe(false)
    expect(isWritableEnvName('XDG_CONFIG_HOME')).toBe(false)
  })
})

describe('env-file CRUD', () => {
  let home: string

  afterEach(() => {
    vi.unstubAllEnvs()
    if (home !== undefined) rmSync(home, { recursive: true, force: true })
  })

  it('creates, updates, and removes entries under $DSH_HOME/.env', () => {
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-'))
    vi.stubEnv('DSH_HOME', home)

    upsertEnvEntry('ALPHA', 'one')
    expect(loadEnvMap()).toEqual({ ALPHA: 'one' })
    expect(readFileSync(join(home, '.env'), 'utf8')).toContain('ALPHA=one')

    upsertEnvEntry('ALPHA', 'two')
    upsertEnvEntry('BETA', 'bee')
    expect(listEnvEntries().entries).toEqual([
      { name: 'ALPHA', value: 'two' },
      { name: 'BETA', value: 'bee' },
    ])

    expect(removeEnvEntry('ALPHA')).toBe(true)
    expect(loadEnvMap()).toEqual({ BETA: 'bee' })
    expect(() => upsertEnvEntry('DSH_HOME', 'nope')).toThrow(/refused/)
  })
})
