# dsh-custom-env

English | [中文](README.zh-CN.md)

Community DeepSeek Harness plugin: manage `$DSH_HOME/.env` from **Settings → Environment**. Not an official DeepSeek AI product.

Writes update `.env`, hot-apply `process.env`, and sync the Windows / macOS user environment. Linux user-env sync is not supported.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

Needs DSH with the `dsh` CLI (`desktop` or `web` profile).

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
# or: dsh plugin --profile web add @woosau/dsh-custom-env
# or: dsh plugin --profile desktop add github:ownduck/dsh-custom-env
```

Close Desktop first on `EPERM` for the profile `package.json`. GitHub installs may need `allowBuilds.koffi: true` in the profile `pnpm-workspace.yaml`. Restart DSH, then open **Settings → Environment**.

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## Settings UI

1. Edit drafts → **Confirm** writes `.env` + Host/OS; **Cancel** reverts inputs
2. **Restore** rewrites the Host-start value for that row
3. Restart DSH or open a new terminal for full OS effect
4. Optional **Install** for this Host’s `dsh` CLI (Windows user PATH / macOS `/usr/local/bin/dsh`)

Bootstrap names (`PATH`, `DSH_*`, `XDG_*`, …) are refused.

## Write rules

| Incoming | Key missing | Key already present (`.env` or OS user env) |
|----------|-------------|-----------------------------------------------|
| Non-empty | create | overwrite |
| Empty | create `NAME=` | **skip** (keep existing, even if empty) |

## Remote API

Host plugins use the `customEnv` service (`ctx.get('customEnv')` or injected `ctx.customEnv`). Settings uses id-based remotes; other plugins usually use name-based `setVar` / `removeVar`.

### By variable name

```ts
const env = ctx.get('customEnv')

await env?.setVar('MY_KEY', 'value')   // create / overwrite
await env?.setVar('MY_KEY', '')        // create only if missing
await env?.removeVar('MY_KEY')         // → boolean (.env line removed?)

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '' },            // skipped if B already exists
])
await env?.removeVars(['A', 'B'])      // → number of .env lines removed
```

Invalid / bootstrap names reject the whole batch.

### By Settings row id

| Remote | Role |
|--------|------|
| `list()` | `{ path, exists, entries[] }` — file order; each entry has `id`, `name`, `value`, `kind`, `previous` |
| `upsert(id, name, value)` | `id === ''` creates; else update/rename that row → snapshot |
| `deleteEntry(id)` | remove by id → snapshot |
| `restore(id)` | Host-start name/value (forced write), or delete if added after start → snapshot |

### CLI helper

| Remote | Role |
|--------|------|
| `cliStatus()` | whether this Host’s `dsh` CLI is installed / offered |
| `cliInstall()` | install / repair the CLI link (Windows / macOS) |

## License

MIT
