/** Pure-function coverage for CLI path resolve / compare helpers. */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { activeMatchesExpected } from '../src/cli-path/inspect-active.ts'
import { normalizeComparable, samePath } from '../src/cli-path/paths.ts'
import { resolveExpectedCli } from '../src/cli-path/resolve-expected.ts'
import { buildCliStatus } from '../src/cli-path/status.ts'

describe('normalizeComparable / samePath', () => {
  it('compares Windows paths case-insensitively', () => {
    assert.equal(
      samePath('C:\\Apps\\Bin\\dsh.cmd', 'c:/apps/bin/dsh.cmd', 'win32'),
      true,
    )
    assert.equal(
      normalizeComparable('C:\\Apps\\Bin\\', 'win32'),
      normalizeComparable('c:/apps/bin', 'win32'),
    )
  })

  it('compares POSIX paths case-sensitively', () => {
    assert.equal(samePath('/usr/local/bin/dsh', '/usr/local/bin/dsh', 'darwin'), true)
    assert.equal(samePath('/usr/local/bin/dsh', '/usr/local/Bin/dsh', 'darwin'), false)
  })
})

describe('resolveExpectedCli', () => {
  it('uses Electron resources when ELECTRON_RUN_AS_NODE is set', () => {
    const files = new Set([
      'C:\\App\\resources\\runtime\\cli\\bin\\dsh.cmd',
    ])
    const resolved = resolveExpectedCli({
      platform: 'win32',
      execPath: 'C:\\App\\VertaxWork.exe',
      electronRunAsNode: '1',
      argv: ['C:\\App\\VertaxWork.exe'],
      exists: path => files.has(path.replaceAll('/', '\\')) || files.has(path),
    })
    assert.ok(resolved)
    assert.equal(resolved.kind, 'electron-resources')
    assert.match(resolved.launcher.replaceAll('\\', '/'), /resources\/runtime\/cli\/bin\/dsh\.cmd$/u)
  })

  it('uses argv when it looks like a CLI entry next to dsh', () => {
    // Use host-native absolute paths so path.resolve does not rewrite foreign roots.
    if (process.platform === 'win32') {
      const files = new Set([
        'C:\\opt\\dsh\\bin\\cli.js',
        'C:\\opt\\dsh\\bin\\dsh.cmd',
      ])
      const resolved = resolveExpectedCli({
        platform: 'win32',
        electronRunAsNode: undefined,
        argv: ['node', 'C:\\opt\\dsh\\bin\\cli.js'],
        exists: path => files.has(path) || files.has(path.replaceAll('/', '\\')),
      })
      assert.ok(resolved)
      assert.match(resolved.launcher.replaceAll('\\', '/'), /opt\/dsh\/bin\/dsh\.cmd$/u)
      return
    }
    const files = new Set([
      '/opt/dsh/bin/cli.js',
      '/opt/dsh/bin/dsh',
    ])
    const resolved = resolveExpectedCli({
      platform: 'darwin',
      electronRunAsNode: undefined,
      argv: ['node', '/opt/dsh/bin/cli.js'],
      exists: path => files.has(path),
    })
    assert.ok(resolved)
    assert.equal(resolved.launcher, '/opt/dsh/bin/dsh')
  })

  it('returns undefined when nothing can be resolved', () => {
    const resolved = resolveExpectedCli({
      platform: 'linux',
      electronRunAsNode: undefined,
      argv: ['node'],
      exists: () => false,
    })
    assert.equal(resolved, undefined)
  })
})

describe('activeMatchesExpected / buildCliStatus', () => {
  it('matches macOS symlink targets to the expected launcher', () => {
    assert.equal(
      activeMatchesExpected(
        { path: '/usr/local/bin/dsh', symlinkTarget: '/App/resources/runtime/cli/bin/dsh' },
        '/App/resources/runtime/cli/bin/dsh',
        'darwin',
      ),
      true,
    )
  })

  it('offers install when active differs on Windows', () => {
    const status = buildCliStatus({
      platform: 'win32',
      expected: {
        launcher: 'C:\\Expected\\dsh.cmd',
        directory: 'C:\\Expected',
        kind: 'argv',
      },
      active: { path: 'C:\\Other\\dsh.cmd', symlinkTarget: undefined },
    })
    assert.equal(status.matches, false)
    assert.equal(status.canInstall, true)
    assert.equal(status.expectedPath, 'C:\\Expected\\dsh.cmd')
  })

  it('hides install when paths match', () => {
    const status = buildCliStatus({
      platform: 'win32',
      expected: {
        launcher: 'C:\\Expected\\dsh.cmd',
        directory: 'C:\\Expected',
        kind: 'argv',
      },
      active: { path: 'c:\\expected\\dsh.cmd', symlinkTarget: undefined },
    })
    assert.equal(status.matches, true)
    assert.equal(status.canInstall, false)
  })

  it('hides install when expected cannot be resolved', () => {
    const status = buildCliStatus({
      platform: 'win32',
      expected: undefined,
      active: { path: undefined, symlinkTarget: undefined },
    })
    assert.equal(status.canInstall, false)
    assert.equal(status.reason, 'could-not-resolve-expected-cli')
  })
})
