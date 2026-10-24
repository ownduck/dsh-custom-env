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

## Prerequisites

- A working DeepSeek Harness install with `dsh` on your PATH (CLI or Desktop-bundled CLI)
- Examples use the `web` profile; replace with your target profile
- The `desktop` profile is managed by the Electron app — use the in-app plugin manager, or edit that profile’s `package.json` manually

## Installation

This repository ships a ready-to-run `lib/`. You do **not** need to publish to npmjs to install from GitHub.

### From GitHub (recommended while unpublished on npm)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add github:ownduck/dsh-custom-env
dsh --profile web --dump-config
```

Equivalent forms:

```powershell
dsh plugin --profile web add https://github.com/ownduck/dsh-custom-env.git
```

The dump should contain a `# == dsh-custom-env` layer and a `custom-env` plugin row. Restart DSH Web and hard-refresh the browser.

### Ask an agent to install it

```text
Install the DSH plugin github:ownduck/dsh-custom-env into my local web profile by running: dsh plugin --profile web add github:ownduck/dsh-custom-env. Then run dsh --profile web --dump-config, confirm the configuration includes dsh-custom-env / custom-env, and explain how to reload DSH and open Settings → Environment.
```

### From a local clone (`file:` / `.`)

```powershell
git clone https://github.com/ownduck/dsh-custom-env.git
cd dsh-custom-env
dsh plugin --profile web add .
# or: dsh plugin --profile web add file:F:/path/to/dsh-custom-env
dsh --profile web --dump-config
```

### From npm (optional, after publish)

If the package is published to the npm registry:

```powershell
dsh plugin --profile web add dsh-custom-env@latest --registry=https://registry.npmjs.org/
```

## Uninstall / reinstall

```powershell
dsh plugin --profile web remove dsh-custom-env
dsh plugin --profile web add github:ownduck/dsh-custom-env
```

For a `file:` / local checkout, rebuild `lib/` after source changes, then restart DSH. Re-run `plugin add` only when `package.json` or `cordis.patch.yml` changed.

## Usage

1. Open **Settings → Environment**
2. Add, edit, or remove variables
3. Host process sees changes immediately; OS user env applies to **new** terminals / apps

Do not store bootstrap names in `.env`. Prefer ordinary names for app config. Names containing `KEY` / `SECRET` / `TOKEN` remain scrubbed from model-visible shells by existing harness policy.

This plugin does **not** install the global `dsh` CLI. Use Desktop **Manage dsh Command…** or `npm install -g`.

## GitHub vs npmjs

| Channel | Enough for users? | Install command |
| --- | --- | --- |
| **GitHub only** | Yes | `dsh plugin add github:ownduck/dsh-custom-env` |
| **npmjs** | Optional | `dsh plugin add dsh-custom-env` |

Pushing to GitHub is enough to share and install. Publishing to npmjs is optional convenience (shorter name, version tags, npm badges), similar to community plugins that also publish `@scope/name` on the registry.

## License

MIT
