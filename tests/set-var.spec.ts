import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import CustomEnvController from '../src/index.ts'
import { loadEnvMap } from '../src/env-file.ts'

describe('setVar / removeVar', () => {
  let home: string | undefined
  let previousHome: string | undefined
  let controller: CustomEnvController | undefined
  const touched = new Set<string>()

  afterEach(() => {
    for (const name of touched) delete process.env[name]
    touched.clear()
    controller = undefined
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
    if (home !== undefined) rmSync(home, { recursive: true, force: true })
    home = undefined
  })

  function start(): CustomEnvController {
    previousHome = process.env.DSH_HOME
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-setvar-'))
    process.env.DSH_HOME = home
    const ctx = new Context()
    controller = new CustomEnvController(ctx)
    return controller
  }

  it('creates, updates, sets empty, and removes by name', async () => {
    const env = start()
    touched.add('PLUGIN_KEY')

    await env.setVar('PLUGIN_KEY', 'one')
    assert.equal(process.env.PLUGIN_KEY, 'one')
    assert.deepEqual(loadEnvMap(), { PLUGIN_KEY: 'one' })
    assert.match(readFileSync(join(home!, '.env'), 'utf8'), /PLUGIN_KEY=one/)

    await env.setVar('PLUGIN_KEY', 'two')
    assert.equal(process.env.PLUGIN_KEY, 'two')
    assert.deepEqual(loadEnvMap(), { PLUGIN_KEY: 'two' })

    await env.setVar('PLUGIN_KEY', '')
    assert.equal(process.env.PLUGIN_KEY, '')
    assert.deepEqual(loadEnvMap(), { PLUGIN_KEY: '' })
    assert.equal(readFileSync(join(home!, '.env'), 'utf8'), 'PLUGIN_KEY=\n')

    assert.equal(await env.removeVar('PLUGIN_KEY'), true)
    assert.equal(process.env.PLUGIN_KEY, undefined)
    assert.deepEqual(loadEnvMap(), {})
    assert.equal(await env.removeVar('PLUGIN_KEY'), false)
  })

  it('rejects bootstrap names on setVar and removeVar', async () => {
    const env = start()
    await assert.rejects(
      () => env.setVar('DSH_HOME', 'nope'),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-name',
    )
    await assert.rejects(
      () => env.removeVar('PATH'),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-name',
    )
  })
})
