# dsh-custom-env

English | [中文](README.zh-CN.md)

Community DeepSeek Harness plugin: manage `$DSH_HOME/.env` from **Settings → Environment**. Not an official DeepSeek AI product.

Edits apply to the Host immediately and sync to the Windows / macOS user environment (new terminals pick up OS changes). Linux user-env sync is not supported.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- CRUD for `$DSH_HOME/.env` in Settings
- Hot-apply to the current Host process
- Sync to Windows / macOS user environment
- Rejects bootstrap names (`PATH`, `DSH_*`, `XDG_*`, …)
- Optional **Install** for the `dsh` CLI used by this Host (Windows / macOS)

## Install

Requires a working DSH install with the `dsh` CLI. Use profile `desktop` or `web`.

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
```

```powershell
dsh plugin --profile web add @woosau/dsh-custom-env
```

GitHub: `dsh plugin --profile desktop add github:ownduck/dsh-custom-env`

Close Desktop first if `plugin` hits `EPERM` on the profile `package.json`. GitHub installs may need `allowBuilds.koffi: true` in the profile `pnpm-workspace.yaml` (native `koffi`). Then restart DSH and open **Settings → Environment**.

## Uninstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## Usage

1. Open **Settings → Environment**
2. Edit as a draft: **Confirm** writes `.env` and live Host/OS; **Cancel** reverts the inputs
3. After Confirm, restart tips appear for new/changed rows; **Restore** writes back the Host-start value
4. Restart DSH or open a new terminal for the full OS effect
5. Use **Install** in the dsh block only when offered (Windows user PATH / macOS `/usr/local/bin/dsh`; may replace Desktop’s link on macOS)

Do not put bootstrap names (including `PATH`) in `.env`.

## Plugin API

Any Host plugin can call the `customEnv` service by name (no Settings row id):

```ts
const env = ctx.get('customEnv') // or ctx.customEnv when injected
await env?.setVar('MY_KEY', 'value') // create or replace
await env?.setVar('MY_KEY', '')      // empty value writes MY_KEY=
await env?.removeVar('MY_KEY')       // returns whether a .env line was removed
```

Bootstrap / reserved names (`PATH`, `DSH_*`, `XDG_*`, …) are refused. Writes update `$DSH_HOME/.env`, hot-apply `process.env`, and sync the Windows / macOS user environment.

## License

MIT
