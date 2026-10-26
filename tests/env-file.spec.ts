import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { isWritableEnvName } from '../src/names.ts'
import { listEnvEntries, loadEnvMap, removeEnvEntry, renameEnvEntry, upsertEnvEntry } from '../src/env-file.ts'

describe('isWritableEnvName', () => {
  it('accepts ordinary names', () => {
    assert.equal(isWritableEnvName('FOO_BAR'), true)
  })

  it('rejects bootstrap names and prefixes', () => {
    assert.equal(isWritableEnvName('PATH'), false)
    assert.equal(isWritableEnvName('DSH_HOME'), false)
    assert.equal(isWritableEnvName('XDG_CONFIG_HOME'), false)
  })
})

describe('env-file CRUD', () => {
  let home: string | undefined
  let previousHome: string | undefined

  afterEach(() => {
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
    if (home !== undefined) rmSync(home, { recursive: true, force: true })
    home = undefined
  })

  it('creates, updates, and removes entries under $DSH_HOME/.env', () => {
    previousHome = process.env.DSH_HOME
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-'))
    process.env.DSH_HOME = home

    upsertEnvEntry('ALPHA', 'one')
    assert.deepEqual(loadEnvMap(), { ALPHA: 'one' })
    assert.match(readFileSync(join(home, '.env'), 'utf8'), /ALPHA=one/)

    upsertEnvEntry('ALPHA', 'two')
    upsertEnvEntry('BETA', 'bee')
    assert.deepEqual(listEnvEntries().entries, [
      { name: 'ALPHA', value: 'two' },
      { name: 'BETA', value: 'bee' },
    ])

    assert.equal(removeEnvEntry('ALPHA'), true)
    assert.deepEqual(loadEnvMap(), { BETA: 'bee' })
    assert.equal(readFileSync(join(home, '.env'), 'utf8'), 'BETA=bee\n')
    assert.throws(() => upsertEnvEntry('DSH_HOME', 'nope'), /refused/)
  })

  it('strips blank gaps left by delete when rewriting', () => {
    previousHome = process.env.DSH_HOME
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-blank-'))
    process.env.DSH_HOME = home
    writeFileSync(join(home, '.env'), 'A=1\n\n\n\nB=2\n\nC=3\n', 'utf8')

    removeEnvEntry('B')
    assert.equal(readFileSync(join(home, '.env'), 'utf8'), 'A=1\nC=3\n')
  })

  it('keeps rename in place and appends new keys at the end', () => {
    previousHome = process.env.DSH_HOME
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-rename-'))
    process.env.DSH_HOME = home
    upsertEnvEntry('FIRST', '1')
    upsertEnvEntry('MIDDLE', '2')
    upsertEnvEntry('LAST', '3')

    renameEnvEntry('MIDDLE', 'MIDDLE_NEW', '22')
    upsertEnvEntry('NEW', '4')
    assert.deepEqual(listEnvEntries().entries, [
      { name: 'FIRST', value: '1' },
      { name: 'MIDDLE_NEW', value: '22' },
      { name: 'LAST', value: '3' },
      { name: 'NEW', value: '4' },
    ])
    assert.equal(
      readFileSync(join(home, '.env'), 'utf8'),
      'FIRST=1\nMIDDLE_NEW=22\nLAST=3\nNEW=4\n',
    )
  })
})
