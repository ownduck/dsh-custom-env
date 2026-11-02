import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_GROUP_ID,
  DEFAULT_GROUP_TITLE,
  clearMembershipMany,
  createGroup,
  deleteGroupMeta,
  normalizeGroupsFile,
  pruneMembership,
  renameGroup,
  resolveGroupId,
  setMembership,
} from '../src/groups-store.ts'

describe('groups-store', () => {
  it('normalizeGroupsFile ensures default and drops bad membership', () => {
    const file = normalizeGroupsFile({
      version: 1,
      groups: [
        { id: 'a1', title: '社媒' },
        { id: 'default', title: 'ignored' },
        { id: 'a1', title: 'dup' },
        { id: '', title: 'bad' },
        { title: 'no-id' },
      ],
      membership: {
        'env-0': 'a1',
        'env-1': 'missing',
        'env-2': '',
        '': 'a1',
      },
    })
    assert.deepEqual(file.groups[0], { id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE })
    assert.equal(file.groups.length, 2)
    assert.equal(file.groups[1]?.id, 'a1')
    assert.equal(file.membership['env-0'], 'a1')
    assert.equal(file.membership['env-1'], DEFAULT_GROUP_ID)
    assert.equal(file.membership['env-2'], undefined)
    assert.equal(file.membership[''], undefined)
  })

  it('normalizeGroupsFile recovers from invalid raw', () => {
    assert.deepEqual(normalizeGroupsFile(null).groups, [
      { id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE },
    ])
    assert.deepEqual(normalizeGroupsFile('x').membership, {})
  })

  it('create / rename / deleteGroupMeta branches', () => {
    let file = normalizeGroupsFile(undefined)
    const created = createGroup(file, ' 社媒 ')
    file = created.file
    assert.match(created.group.id, /^g-[0-9a-f]+$/u)
    assert.equal(created.group.title, '社媒')

    file = setMembership(file, 'env-0', created.group.id)
    file = setMembership(file, 'env-1', created.group.id)
    assert.equal(resolveGroupId(file, 'env-0'), created.group.id)
    assert.equal(resolveGroupId(file, 'env-missing'), DEFAULT_GROUP_ID)

    file = renameGroup(file, created.group.id, '媒体')
    assert.equal(file.groups.find(group => group.id === created.group.id)?.title, '媒体')

    assert.throws(() => renameGroup(file, DEFAULT_GROUP_ID, 'x'), /cannot rename default/)
    assert.throws(() => deleteGroupMeta(file, DEFAULT_GROUP_ID, true), /cannot delete default/)

    const moved = deleteGroupMeta(file, created.group.id, true)
    assert.equal(moved.file.groups.some(group => group.id === created.group.id), false)
    assert.deepEqual(moved.memberIds.sort(), ['env-0', 'env-1'])
    assert.equal(moved.file.membership['env-0'], DEFAULT_GROUP_ID)
    assert.equal(moved.file.membership['env-1'], DEFAULT_GROUP_ID)

    file = {
      ...normalizeGroupsFile(undefined),
      groups: [
        { id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE },
        created.group,
      ],
    }
    file = setMembership(file, 'env-0', created.group.id)
    const dropped = deleteGroupMeta(file, created.group.id, false)
    assert.equal(dropped.file.membership['env-0'], undefined)
    assert.deepEqual(dropped.memberIds, ['env-0'])
  })

  it('pruneMembership and clearMembershipMany', () => {
    let file = normalizeGroupsFile({
      groups: [{ id: DEFAULT_GROUP_ID, title: DEFAULT_GROUP_TITLE }, { id: 'g1', title: 'G' }],
      membership: { 'env-0': 'g1', 'env-1': 'g1', orphan: 'g1' },
    })
    file = pruneMembership(file, new Set(['env-0']))
    assert.deepEqual(file.membership, { 'env-0': 'g1' })
    file = clearMembershipMany(file, ['env-0', 'missing'])
    assert.deepEqual(file.membership, {})
  })
})
