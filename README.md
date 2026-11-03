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
3. **Groups** (accordion) are UI/plugin labels only — they do not change `process.env` / OS sync. `.env` stays `NAME=value`; group metadata is `$DSH_HOME/.dsh-custom-env-groups.json`. Create / rename / delete groups from the headers; move a saved row with **Move to group**
4. Paste `NAME=VALUE` lines into an empty row to add or update several variables at once (same names overlay existing rows as drafts and keep their group)
5. Drag across rows to multi-select, or Ctrl/Cmd+click to toggle; Ctrl/Cmd+C copies selected rows as `NAME=VALUE` (input text selection still wins when present)
6. **Restore** brings back the value from when this app session started
7. At startup, values are injected into the Host `process.env` first; writing the user environment (registry / launchctl) is deferred via `setImmediate` into a child process and is not broadcast. Log off or reboot before other tools need those values
8. Use **Install** only when shown, to wire this Host’s `dsh` command into your user PATH (Windows / macOS)

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

await env?.setVar('MY_KEY', 'value')              // create → default group; existing keep group
await env?.setVar('MY_KEY', 'value', someGroupId) // also set / move group
await env?.setVar('MY_KEY', '')                   // create only if missing
await env?.removeVar('MY_KEY')

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '', group: someGroupId }, // no-op if B already exists
])
await env?.removeVars(['A', 'B'])

const group = await env?.createGroup('Social')
await env?.renameGroup(group!.id, 'Social media')
await env?.deleteGroup(group!.id, { moveToDefault: true })
await env?.moveEntry(rowId, group!.id)
```

Reserved names are rejected (batch calls fail entirely). Unknown group ids raise `custom-env/invalid-group`.

| Call | Purpose |
|------|---------|
| `setVar(name, value, group?)` | Create/replace by name. Omit `group`: new → `default`, existing keep group. Pass `group` to assign/move |
| `setVars([{ name, value, group? }, ...])` | Same rules per entry; last duplicate name wins |
| `removeVar(name)` / `removeVars(names)` | Delete by name (clears membership) |
| `createGroup(title)` | Create custom group; returns `{ id, title }` |
| `renameGroup(id, title)` | Rename custom group (not `default`) |
| `deleteGroup(id, { moveToDefault })` | Delete custom group; `true` moves members to default, `false` deletes their variables |
| `moveEntry(id, groupId)` | Move one row (by Settings row id) to another group |

**Settings UI — by row id**

| Call | Purpose |
|------|---------|
| `list()` | Variables + `groups`; each entry has `groupId` |
| `upsert(id, name, value, groupId?)` | Create (`id` empty; `groupId` defaults to `default`) or update/rename by id (omit `groupId` to keep group) |
| `deleteEntry(id)` | Delete that row |
| `restore(id)` | Restore session-start value, or remove if the row was added later |

**CLI helpers**

| Call | Purpose |
|------|---------|
| `cliStatus()` | Whether this Host’s `dsh` CLI is ready / can be installed |
| `cliInstall()` | Install or repair that CLI entry |

## License

MIT
