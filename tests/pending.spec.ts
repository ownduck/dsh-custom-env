import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyEntry } from '../src/types.ts'

describe('classifyEntry', () => {
  const base = new Map([['env-1', { name: 'FOO', value: 'bar' }]])

  it('marks ids absent from baseline as added', () => {
    assert.deepEqual(classifyEntry('env-1', 'NEW', 'x', new Map()), { kind: 'added', previous: null })
  })

  it('marks equal baseline name and value as unchanged', () => {
    assert.deepEqual(classifyEntry('env-1', 'FOO', 'bar', base), { kind: 'unchanged', previous: null })
  })

  it('marks a value change as modified with the original value', () => {
    assert.deepEqual(classifyEntry('env-1', 'FOO', 'baz', base), { kind: 'modified', previous: 'bar' })
  })

  it('marks a rename as modified even when the value matches the original', () => {
    assert.deepEqual(classifyEntry('env-1', 'FOO2', 'bar', base), { kind: 'modified', previous: 'bar' })
  })

  it('marks rename plus value change as modified with the original value', () => {
    assert.deepEqual(classifyEntry('env-1', 'FOO2', 'baz', base), { kind: 'modified', previous: 'bar' })
  })
})
