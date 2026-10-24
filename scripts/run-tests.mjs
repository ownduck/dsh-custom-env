/** Run node:test specs with tsx + peer packages from a sibling vertax-work tree. */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const monorepo = join(root, '..', 'vertax-work')
const homePaths = join(monorepo, 'packages', 'util', 'home-paths')
const peerLink = join(root, 'node_modules', '@deepseek-ai', 'dsh-home-paths')
if (existsSync(homePaths) && !existsSync(peerLink)) {
  mkdirSync(dirname(peerLink), { recursive: true })
  const link = spawnSync(
    process.platform === 'win32' ? 'cmd' : 'ln',
    process.platform === 'win32'
      ? ['/c', 'mklink', '/J', peerLink, homePaths]
      : ['-s', homePaths, peerLink],
    { stdio: 'ignore' },
  )
  if (link.status !== 0) {
    process.stderr.write('warning: could not link @deepseek-ai/dsh-home-paths for local tests\n')
  }
}
const loaderCandidates = [
  join(root, 'node_modules', 'tsx', 'dist', 'loader.mjs'),
  join(monorepo, 'node_modules', '.pnpm', 'tsx@4.23.13', 'node_modules', 'tsx', 'dist', 'loader.mjs'),
]
const loader = loaderCandidates.find(path => existsSync(path))
if (loader === undefined) {
  process.stderr.write('tsx loader not found; install tsx or keep a sibling vertax-work checkout.\n')
  process.exit(1)
}

const nodePath = [
  join(monorepo, 'node_modules'),
  join(monorepo, 'packages', 'util', 'home-paths'),
  process.env.NODE_PATH,
].filter(Boolean).join(process.platform === 'win32' ? ';' : ':')

const result = spawnSync(
  process.execPath,
  ['--import', pathToFileURL(loader).href, '--test', 'tests/cli-path.spec.ts', 'tests/env-file.spec.ts'],
  {
    cwd: root,
    env: { ...process.env, NODE_PATH: nodePath },
    stdio: 'inherit',
  },
)
process.exit(result.status ?? 1)
