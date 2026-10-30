# dsh-custom-env

English | [中文](README.zh-CN.md)

Community DeepSeek Harness plugin for managing environment variables in **Settings → Environment**. Not an official DeepSeek AI product.

Changes apply to the running app right away, and on Windows / macOS also to the user environment so new terminals can see them. Linux user-environment sync is not supported.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install

Requires DSH with the `dsh` CLI (`desktop` or `web`).

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
# or: dsh plugin --profile web add @woosau/dsh-custom-env
# or: dsh plugin --profile desktop add github:ownduck/dsh-custom-env
```

If install fails because Desktop is locking files, quit Desktop first. After install, restart DSH and open **Settings → Environment**.

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## For users

1. Open **Settings → Environment**
2. Edit a row as a draft → **Confirm** to save, **Cancel** to discard
3. **Restore** brings back the value from when this app session started
4. At startup, values are injected into the Host `process.env` first; writing the user environment (registry / launchctl) is deferred off the boot path and is not broadcast. Log off or reboot before other tools need those values
5. Use **Install** only when shown, to wire this Host’s `dsh` command into your user PATH (Windows / macOS)

System-reserved names (such as `PATH` and names starting with `DSH_` / `XDG_`) cannot be edited here.

### When saving a value

| You save | Variable does not exist yet | Variable already exists |
|----------|-----------------------------|-------------------------|
| A non-empty value | Created | Replaced |
| An empty value | Created as empty | Left unchanged |

## For other plugins (Remote API)

Call the Host `customEnv` service (`ctx.get('customEnv')` or injected `ctx.customEnv`).

**Everyday use — by variable name**

```ts
const env = ctx.get('customEnv')

await env?.setVar('MY_KEY', 'value')  // create or replace
await env?.setVar('MY_KEY', '')       // create only if missing
await env?.removeVar('MY_KEY')

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '' },           // no-op if B already exists
])
await env?.removeVars(['A', 'B'])
```

Reserved names are rejected (batch calls fail entirely).

**Settings UI — by row id**

| Call | Purpose |
|------|---------|
| `list()` | Current variables and row ids |
| `upsert(id, name, value)` | Create (`id` empty) or update/rename a row |
| `deleteEntry(id)` | Delete that row |
| `restore(id)` | Restore session-start value, or remove if the row was added later |

**CLI helpers**

| Call | Purpose |
|------|---------|
| `cliStatus()` | Whether this Host’s `dsh` CLI is ready / can be installed |
| `cliInstall()` | Install or repair that CLI entry |

## License

MIT
