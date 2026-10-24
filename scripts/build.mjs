/** Rebuild lib/index.js, lib/client.js, and declaration stubs using the monorepo esbuild. */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const monorepo = join(root, '..', 'vertax-work')
const pnpm = join(monorepo, 'node_modules', '.pnpm')
const esbuildDir = readdirSync(pnpm).find(name => name.startsWith('esbuild@0.28.2'))
  ?? readdirSync(pnpm).find(name => name.startsWith('esbuild@0.28'))
  ?? readdirSync(pnpm).find(name => name.startsWith('esbuild@'))
if (esbuildDir === undefined) throw new Error('esbuild not found under vertax-work/node_modules/.pnpm')
const require = createRequire(join(pnpm, esbuildDir, 'node_modules', 'esbuild', 'package.json'))
const esbuild = require('esbuild')

// Only platform-seeded Client modules stay external. Bundle typert remote-info
// into client.js — it is not in PLATFORM_MODULES and would fail ModuleLoader require.
const clientExternals = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'zod',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-api-remotes/client',
  '@deepseek-ai/dsh-client-locale/client',
  '@deepseek-ai/dsh-client-ui-settings/client',
  '@deepseek-ai/dsh-client-ui-renderer/client',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
]

mkdirSync(join(root, 'lib'), { recursive: true })
mkdirSync(join(root, 'lib', 'types'), { recursive: true })

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, 'src', 'index.ts')],
  outfile: join(root, 'lib', 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: false,
  packages: 'external',
})

await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, 'src', 'client', 'index.ts')],
  outfile: join(root, 'lib', 'client.js'),
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  sourcemap: true,
  // Use the automatic JSX runtime so the bundle does not assume a global `React`.
  jsx: 'automatic',
  // Resolve peer packages from the sibling harness checkout while developing.
  nodePaths: [join(monorepo, 'node_modules')],
  external: clientExternals,
  plugins: [{
    name: 'typert-remote-client',
    setup(build) {
      build.onResolve({ filter: /typert\.remote-client\.js$/ }, () => ({
        path: join(root, 'lib', 'typert.remote-client.js'),
      }))
      const protocolRoot = join(monorepo, 'packages', 'typert', 'protocol')
      const remoteInfoCandidates = [
        join(protocolRoot, 'lib', 'types', 'remote-info.js'),
        join(protocolRoot, 'src', 'remote-info.ts'),
      ]
      build.onResolve({ filter: /^@deepseek-ai\/dsh-typert-protocol\/remote-info$/ }, () => {
        const path = remoteInfoCandidates.find(candidate => existsSync(candidate))
        if (path === undefined) return undefined
        return { path }
      })
    },
  }, {
    name: 'css-modules-inline',
    setup(build) {
      const { readFileSync } = require('node:fs')
      build.onLoad({ filter: /\.module\.css$/ }, (args) => {
        const css = readFileSync(args.path, 'utf8')
        const locals = Object.create(null)
        const transformed = css.replace(/\.([A-Za-z_][\w-]*)\s*\{/g, (_match, name) => {
          const local = `EnvSettingsSection_${name}`
          locals[name] = local
          return `.${local}{`
        })
        const js = [
          `const css = ${JSON.stringify(transformed)};`,
          `if (typeof document !== "undefined" && !document.getElementById("dsh-custom-env-css")) {`,
          `  const style = document.createElement("style");`,
          `  style.id = "dsh-custom-env-css";`,
          `  style.textContent = css;`,
          `  document.head.appendChild(style);`,
          `}`,
          `export default ${JSON.stringify(locals)};`,
        ].join('\n')
        return { contents: js, loader: 'js' }
      })
    },
  }],
  banner: {
    js: [
      'window.__ModuleLoader__.load({ id: "dsh-custom-env", factory: (require) => {',
      'var module = { exports: {} };',
      'var exports = module.exports;',
      'Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
    ].join('\n'),
  },
  footer: {
    js: 'return module.exports;\n\t}\n});',
  },
})

const tsc = join(monorepo, 'node_modules', '.bin', 'tsc.CMD')
const tsconfig = join(root, 'tsconfig.build.json')
writeFileSync(tsconfig, `${JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    declaration: true,
    emitDeclarationOnly: true,
    declarationMap: false,
    outDir: 'lib/types',
    rootDir: 'src',
    strict: true,
    skipLibCheck: true,
    jsx: 'react-jsx',
    types: ['node'],
  },
  include: ['src/**/*.ts', 'src/**/*.tsx'],
}, null, 2)}\n`)

const result = spawnSync(tsc, ['-p', tsconfig], { cwd: root, encoding: 'utf8', shell: true })
if (result.status !== 0) {
  process.stderr.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  // Declarations are best-effort when peer types are missing outside the monorepo.
  process.stderr.write('tsc declaration emit reported errors; continuing with hand-maintained lib/types where needed.\n')
}

process.stdout.write('build: wrote lib/index.js and lib/client.js\n')
