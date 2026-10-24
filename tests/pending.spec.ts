import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyEntry } from '../src/pending.ts'

describe('classifyEntry', () => {
  it('marks names absent from baseline as added', () => {
    assert.deepEqual(classifyEntry('NEW', 'x', {}), { kind: 'added', previous: null })
  })

  it('marks equal baseline values as unchanged', () => {
    assert.deepEqual(
      classifyEntry('FOO', 'bar', { FOO: 'bar' }),
      { kind: 'unchanged', previous: null },
    )
  })

  it('marks differing baseline values as modified with previous', () => {
    assert.deepEqual(
      classifyEntry('FOO', 'baz', { FOO: 'bar' }),
      { kind: 'modified', previous: 'bar' },
    )
  })
})
