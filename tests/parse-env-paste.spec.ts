import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatEnvCopy, parseEnvPaste } from '../src/client/parse-env-paste.ts'

describe('parseEnvPaste', () => {
  it('parses one pair and trims spaces around name, equals, and value', () => {
    assert.deepEqual(parseEnvPaste('  MEMOS_API_KEY = mpg-abc  '), [
      { name: 'MEMOS_API_KEY', value: 'mpg-abc' },
    ])
  })

  it('parses multiple lines and skips blanks', () => {
    const text = [
      'MEMOS_API_KEY=mpg-1e1Cde7tXUKWV2WiplHB9OemK67ncngThHXnRyTD',
      '',
      'MEMOS_USER_ID=wuxiao01',
      '  ',
    ].join('\n')
    assert.deepEqual(parseEnvPaste(text), [
      { name: 'MEMOS_API_KEY', value: 'mpg-1e1Cde7tXUKWV2WiplHB9OemK67ncngThHXnRyTD' },
      { name: 'MEMOS_USER_ID', value: 'wuxiao01' },
    ])
  })

  it('accepts CRLF and keeps value content after the first equals', () => {
    assert.deepEqual(parseEnvPaste('A=b=c\r\nB=x'), [
      { name: 'A', value: 'b=c' },
      { name: 'B', value: 'x' },
    ])
  })

  it('skips lines without equals or with an empty name', () => {
    assert.deepEqual(parseEnvPaste('noequals\n=onlyvalue\nOK=1'), [
      { name: 'OK', value: '1' },
    ])
  })

  it('skips invalid names', () => {
    assert.deepEqual(parseEnvPaste('1BAD=x\n-BAD=y\nGOOD_NAME=z'), [
      { name: 'GOOD_NAME', value: 'z' },
    ])
  })

  it('keeps the last value when a name repeats in one paste', () => {
    assert.deepEqual(parseEnvPaste('A=1\nB=2\nA=3'), [
      { name: 'A', value: '3' },
      { name: 'B', value: '2' },
    ])
  })

  it('returns an empty list for plain text', () => {
    assert.deepEqual(parseEnvPaste('just text'), [])
  })
})

describe('formatEnvCopy', () => {
  it('joins pairs as NAME=VALUE lines', () => {
    assert.equal(
      formatEnvCopy([
        { name: 'A', value: '1' },
        { name: 'B', value: 'x=y' },
      ]),
      'A=1\nB=x=y',
    )
  })

  it('skips empty names and returns empty when nothing usable', () => {
    assert.equal(formatEnvCopy([{ name: '  ', value: 'x' }]), '')
    assert.equal(formatEnvCopy([]), '')
  })

  it('round-trips with parseEnvPaste for ordinary pairs', () => {
    const text = formatEnvCopy([
      { name: 'MEMOS_API_KEY', value: 'mpg-abc' },
      { name: 'MEMOS_USER_ID', value: 'wuxiao01' },
    ])
    assert.deepEqual(parseEnvPaste(text), [
      { name: 'MEMOS_API_KEY', value: 'mpg-abc' },
      { name: 'MEMOS_USER_ID', value: 'wuxiao01' },
    ])
  })
})
