# dsh-custom-env

English | [中文](README.zh-CN.md)

Community DeepSeek Harness (DSH) plugin for managing `$DSH_HOME/.env` from **Settings → Environment**. Not an official DeepSeek AI product.

On save, values are applied to the Host `process.env` immediately and synced to the **Windows / macOS** user environment (new terminals pick up OS changes after they start). Linux user-env sync is not supported.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-custom-env)

## Features

- Settings page CRUD for `$DSH_HOME/.env` (create the file if missing)
- Hot-apply to the current Host process
- Sync to OS user environment on Windows and macOS
- Rejects bootstrap names (`PATH`, `DSH_*`, `XDG_*`, …) that app-boot will not load from `.env`
- **dsh command panel**: shows the `dsh` on your user PATH vs the launcher that started this Host; when they differ, an **Install** button appears (Windows user PATH / macOS `/usr/local/bin/dsh`). No uninstall button.

## Prerequisites

- A working DeepSeek Harness install with `dsh` on your PATH (CLI or Desktop-bundled CLI)
- Pick a profile: `desktop` (Electron app) or `web` (browser UI). Examples below show both.

## Installation

Published on npm as `@woosau/dsh-custom-env`. GitHub install still works without npm.

### Desktop (recommended)

Close Desktop / VertaxWork first if `plugin` fails with `EPERM` on the profile `package.json`.

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
```

From GitHub instead: `dsh plugin --profile desktop add github:ownduck/dsh-custom-env`

This plugin depends on `koffi` (native). GitHub installs may need `allowBuilds.koffi: true` in the profile `pnpm-workspace.yaml` before re-running `add`. npm installs usually ship prebuilt binaries and skip that step.

Restart Desktop. Open **Settings → Environment**.

### Web

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add @woosau/dsh-custom-env
dsh --profile web --dump-config
```

GitHub: `dsh plugin --profile web add github:ownduck/dsh-custom-env`

The dump should contain a `# == dsh-custom-env` / `@woosau/dsh-custom-env` layer and a `custom-env` plugin row. Restart DSH Web and hard-refresh the browser.

### Ask an agent to install it

```text
Install the DSH plugin @woosau/dsh-custom-env into my local desktop profile by running: dsh plugin --profile desktop add @woosau/dsh-custom-env. Then confirm Settings → Environment appears after restarting Desktop.
```

### From a local clone (`file:` / `.`)

```powershell
git clone https://github.com/ownduck/dsh-custom-env.git
cd dsh-custom-env
dsh plugin --profile desktop add .
# or: dsh plugin --profile web add .
dsh --profile web --dump-config
```

### From npm (explicit registry)

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env@latest --registry=https://registry.npmjs.org/
```

## Uninstall / reinstall

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
dsh plugin --profile desktop add @woosau/dsh-custom-env
```

For a `file:` / local checkout, rebuild `lib/` after source changes, then restart DSH. Re-run `plugin add` only when `package.json` or `cordis.patch.yml` changed.

## Usage

1. Open **Settings → Environment**
2. Edit as a **draft**: **Confirm** writes `$DSH_HOME/.env` (and Host/OS live); **Cancel** only reverts the input
3. After Confirm, rows show a restart tip — **new** items say “added”; **modified** items (relative to Host start) also get **Restore** (writes back the Host-start value)
4. Restart DSH / open a new terminal for the full OS effect; after Host restart, tips and Restore clear
5. In the **dsh command** block, compare PATH vs expected; click **Install** only when offered

Do not store bootstrap names in `.env` (including `PATH`). Prefer ordinary names for app config. Names containing `KEY` / `SECRET` / `TOKEN` remain scrubbed from model-visible shells by existing harness policy.

### Installing the `dsh` CLI from Settings

Expected path is inferred from **how this Host was started** (Desktop packaged `resources/runtime/cli/bin`, or the Node/source launcher on `argv`).

| Platform | What Install does | Conflict note |
| --- | --- | --- |
| **Windows** | Prepends the expected bin directory to the **user** `Path` (registry). Ownership key: `Software\dsh-custom-env\Command` (not DeepSeekHarness). | Can coexist with Desktop’s PATH entry; whichever directory is first wins in new terminals. |
| **macOS** | Writes symlink `/usr/local/bin/dsh` → expected launcher. Receipt: `.dsh-custom-env-command.json`. | **Same path as Desktop “Manage dsh Command…”** — installing here may replace that link. |
| **Linux** | Status only; no Install button. | — |

Open a **new** terminal after Install. This plugin never calls Desktop `app.relaunch`.

## Development

```powershell
cd dsh-custom-env
pnpm test   # or: node --import tsx/esm --test tests/*.spec.ts
pnpm build  # rebuilds lib/ (needs sibling vertax-work esbuild for client bundle)
```

Tests live under [`tests/`](tests/) (`env-file.spec.ts`, `cli-path.spec.ts`). Docs are this README pair only.

## GitHub vs npmjs

| Channel | Enough for users? | Install command |
| --- | --- | --- |
| **GitHub only** | Yes | `dsh plugin add github:ownduck/dsh-custom-env` |
| **npmjs** | Recommended | `dsh plugin add @woosau/dsh-custom-env` |

Pushing to GitHub is enough to share and install. Publishing to npmjs is optional convenience (shorter name, version tags, npm badges), similar to community plugins that also publish `@scope/name` on the registry.

## License

MIT
