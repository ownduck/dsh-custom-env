/** Resolve tsx from a sibling vertax-work checkout when developing this plugin locally. */
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(root, 'package.json'))
let loader
try {
  loader = require.resolve('tsx/dist/loader.mjs')
} catch {
  loader = join(root, '..', 'vertax-work', 'node_modules', '.pnpm', 'tsx@4.23.13', 'node_modules', 'tsx', 'dist', 'loader.mjs')
}
await import(pathToFileURL(loader).href)
