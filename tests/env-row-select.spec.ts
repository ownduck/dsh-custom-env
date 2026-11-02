import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rangeIds, selectedEnvCopyText } from '../src/client/env-row-select.ts'

describe('rangeIds', () => {
  it('returns an inclusive span in list order', () => {
    assert.deepEqual(rangeIds(['a', 'b', 'c', 'd'], 'b', 'd'), ['b', 'c', 'd'])
    assert.deepEqual(rangeIds(['a', 'b', 'c'], 'c', 'a'), ['a', 'b', 'c'])
  })

  it('returns empty when an endpoint is missing', () => {
    assert.deepEqual(rangeIds(['a', 'b'], 'a', 'z'), [])
  })
})

describe('selectedEnvCopyText', () => {
  it('emits NAME=VALUE lines in list order for selected drafts', () => {
    const text = selectedEnvCopyText(
      new Set(['2', '1']),
      ['1', '2', '3'],
      {
        '1': { name: 'A', value: '1' },
        '2': { name: 'B', value: 'x=y' },
        '3': { name: 'C', value: '3' },
      },
    )
    assert.equal(text, 'A=1\nB=x=y')
  })

  it('skips empty names and returns empty when nothing selected', () => {
    assert.equal(selectedEnvCopyText(new Set(), ['1'], { '1': { name: 'A', value: '1' } }), '')
    assert.equal(
      selectedEnvCopyText(new Set(['1']), ['1'], { '1': { name: '  ', value: '1' } }),
      '',
    )
  })
})
