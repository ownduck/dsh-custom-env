import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'
import CustomEnvController from '../src/index.ts'
import { DEFAULT_GROUP_ID, groupsFilePath } from '../src/groups-store.ts'
import { readEnvMap } from '../src/env-file.ts'

describe('customEnv groups API', () => {
  let home: string | undefined
  let previousHome: string | undefined
  let controller: CustomEnvController | undefined
  const touched = new Set<string>()

  afterEach(async () => {
    if (controller !== undefined && touched.size > 0) {
      try {
        await controller.removeVars([...touched])
      } catch {
        // best-effort OS/.env cleanup
      }
    }
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
    home = mkdtempSync(join(tmpdir(), 'dsh-custom-env-groups-'))
    process.env.DSH_HOME = home
    const ctx = new Context()
    controller = new CustomEnvController(ctx)
    return controller
  }

  it('setVar defaults to default group and rejects unknown group', async () => {
    const env = start()
    touched.add('G_DEFAULT')

    await env.setVar('G_DEFAULT', '1')
    const snap = await env.list()
    const row = snap.entries.find(entry => entry.name === 'G_DEFAULT')
    assert.ok(row)
    assert.equal(row.groupId, DEFAULT_GROUP_ID)
    assert.ok(snap.groups.some(group => group.id === DEFAULT_GROUP_ID))

    await assert.rejects(
      () => env.setVar('G_DEFAULT', '2', 'no-such-group'),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-group',
    )
    assert.equal(process.env.G_DEFAULT, '1')
  })

  it('setVar / setVars assign known groups; omit group keeps existing membership', async () => {
    const env = start()
    touched.add('A').add('B').add('C')
    const group = await env.createGroup('社媒')
    assert.match(group.id, /^g-/u)
    assert.equal(group.title, '社媒')

    await env.setVar('A', '1', group.id)
    await env.setVars([{ name: 'B', value: '2', group: group.id }])
    let snap = await env.list()
    assert.equal(snap.entries.find(entry => entry.name === 'A')?.groupId, group.id)
    assert.equal(snap.entries.find(entry => entry.name === 'B')?.groupId, group.id)

    await env.setVar('A', '1b')
    await env.setVars([{ name: 'B', value: '2b' }, { name: 'C', value: '3' }])
    snap = await env.list()
    assert.equal(snap.entries.find(entry => entry.name === 'A')?.groupId, group.id)
    assert.equal(snap.entries.find(entry => entry.name === 'B')?.groupId, group.id)
    assert.equal(snap.entries.find(entry => entry.name === 'C')?.groupId, DEFAULT_GROUP_ID)
    assert.equal(process.env.A, '1b')
    assert.equal(process.env.B, '2b')

    const sidecar = JSON.parse(readFileSync(groupsFilePath(), 'utf8')) as {
      membership: Record<string, string>
    }
    const aId = snap.entries.find(entry => entry.name === 'A')!.id
    assert.equal(sidecar.membership[aId], group.id)
  })

  it('upsert create needs group; update by id keeps group unless groupId passed', async () => {
    const env = start()
    touched.add('U1')
    const group = await env.createGroup('目标')
    await env.upsert('', 'U1', 'one', group.id)
    let snap = await env.list()
    const id = snap.entries.find(entry => entry.name === 'U1')!.id
    assert.equal(snap.entries.find(entry => entry.id === id)?.groupId, group.id)

    snap = await env.upsert(id, 'U1', 'two')
    assert.equal(snap.entries.find(entry => entry.id === id)?.groupId, group.id)
    assert.equal(process.env.U1, 'two')

    snap = await env.upsert(id, 'U1', 'three', DEFAULT_GROUP_ID)
    assert.equal(snap.entries.find(entry => entry.id === id)?.groupId, DEFAULT_GROUP_ID)
  })

  it('deleteGroup moveToDefault keeps vars; false deletes them', async () => {
    const env = start()
    touched.add('KEEP').add('DROP')
    const group = await env.createGroup('临时')
    await env.setVar('KEEP', '1', group.id)
    const keepId = (await env.list()).entries.find(entry => entry.name === 'KEEP')!.id

    await env.deleteGroup(group.id, { moveToDefault: true })
    let snap = await env.list()
    assert.equal(snap.groups.some(item => item.id === group.id), false)
    assert.equal(snap.entries.find(entry => entry.name === 'KEEP')?.groupId, DEFAULT_GROUP_ID)
    assert.equal(readEnvMap().KEEP, '1')
    assert.equal((await env.list()).entries.find(entry => entry.id === keepId)?.name, 'KEEP')

    const other = await env.createGroup('再删')
    await env.setVar('DROP', '9', other.id)
    await env.deleteGroup(other.id, { moveToDefault: false })
    snap = await env.list()
    assert.equal(snap.entries.some(entry => entry.name === 'DROP'), false)
    assert.equal(readEnvMap().DROP, undefined)
    assert.equal(process.env.DROP, undefined)
    touched.delete('DROP')
  })

  it('moveEntry changes group only; rename/delete default refused', async () => {
    const env = start()
    touched.add('M')
    const group = await env.createGroup('目标')
    await env.setVar('M', '1')
    const id = (await env.list()).entries.find(entry => entry.name === 'M')!.id
    const moved = await env.moveEntry(id, group.id)
    assert.equal(moved.entries.find(entry => entry.id === id)?.groupId, group.id)

    await assert.rejects(
      () => env.renameGroup(DEFAULT_GROUP_ID, 'x'),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-group',
    )
    await assert.rejects(
      () => env.deleteGroup(DEFAULT_GROUP_ID, { moveToDefault: true }),
      (error: unknown) => error instanceof RemoteError && error.code === 'custom-env/invalid-group',
    )
  })
})
