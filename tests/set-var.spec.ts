import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import CustomEnvController from '../src/index.ts'
import { loadEnvMap } from '../src/env-file.ts'

describe('setVar / removeVar / setVars / removeVars', () => {
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

  it('setVars writes many keys once and last duplicate wins', async () => {
    const env = start()
    touched.add('A').add('B').add('C')

    await env.setVars([
      { name: 'A', value: '1' },
      { name: 'B', value: '2' },
      { name: 'A', value: '9' },
      { name: 'C', value: '' },
    ])
    assert.equal(process.env.A, '9')
    assert.equal(process.env.B, '2')
    assert.equal(process.env.C, '')
    assert.deepEqual(loadEnvMap(), { A: '9', B: '2', C: '' })
    assert.equal(readFileSync(join(home!, '.env'), 'utf8'), 'A=9\nB=2\nC=\n')
  })

  it('setVars empty array is a no-op', async () => {
    const env = start()
    await env.setVars([])
    assert.equal(existsSync(join(home!, '.env')), false)
  })

  it('removeVars deletes many and returns removed line count', async () => {
    const env = start()
    touched.add('X').add('Y').add('Z')
    await env.setVars([
      { name: 'X', value: '1' },
      { name: 'Y', value: '2' },
      { name: 'Z', value: '3' },
    ])

    assert.equal(await env.removeVars(['Y', 'MISSING', 'X', 'Y']), 2)
    assert.equal(process.env.X, undefined)
    assert.equal(process.env.Y, undefined)
    assert.equal(process.env.Z, '3')
    assert.deepEqual(loadEnvMap(), { Z: '3' })
    assert.equal(await env.removeVars([]), 0)
  })

  it('rejects bootstrap names on setVars and removeVars without writing', async () => {
    const env = start()
    touched.add('OK')
    await env.setVar('OK', '1')

    await assert.rejects(
      () => env.setVars([{ name: 'OK', value: '2' }, { name: 'PATH', value: 'x' }]),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-name',
    )
    assert.equal(process.env.OK, '1')
    assert.deepEqual(loadEnvMap(), { OK: '1' })

    await assert.rejects(
      () => env.removeVars(['OK', 'DSH_HOME']),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-name',
    )
    assert.equal(process.env.OK, '1')
    assert.deepEqual(loadEnvMap(), { OK: '1' })
  })
})
