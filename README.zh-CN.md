# dsh-custom-env

[English](README.md) | 中文

社区 DeepSeek Harness 插件：在 **设置 → 环境变量** 里管理环境变量。非 DeepSeek AI 官方产品。

保存后立即作用于当前应用；在 Windows / macOS 上还会写入用户环境，方便新开的终端读到。不支持同步 Linux 用户环境。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 安装

需已安装 DSH，并能使用 `dsh` 命令（`desktop` 或 `web`）。

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
# 或: dsh plugin --profile web add @woosau/dsh-custom-env
# 或: dsh plugin --profile desktop add github:ownduck/dsh-custom-env
```

若因 Desktop 占用文件导致安装失败，先退出 Desktop。安装后重启 DSH，打开 **设置 → 环境变量**。

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## 给使用者

1. 打开 **设置 → 环境变量**
2. 先改草稿 → **确定** 保存，**取消** 放弃
3. **分组**（手风琴）只是设置页/插件侧的归类，不改变 `process.env` / 操作系统同步。`.env` 仍只存 `NAME=value`；分组元数据在 `$DSH_HOME/.dsh-custom-env-groups.json`。可在标题栏新建/改名/删组；已保存行可用 **修改分组** 迁组
4. 在空行粘贴多行 `NAME=VALUE` 可批量新增或覆盖同名变量（同名写入原行草稿，且不改其所属分组）
5. 拖动可多选行，Ctrl/Cmd+点击切换选中；Ctrl/Cmd+C 按 `NAME=VALUE` 复制选中行（若 Input 内有文字选区则优先复制文字）
6. **恢复** 可回到本次应用启动时的值
7. 启动时先注入当前 Host 的 `process.env`；写入用户环境（注册表 / launchctl）会延后到启动路径之后，且不会广播。其它工具若要读到，请注销/重启后再开终端
8. 仅在出现 **安装** 时使用：把本 Host 的 `dsh` 接到用户 PATH（Windows / macOS）

系统保留名（如 `PATH`，以及 `DSH_` / `XDG_` 开头）不可在此编辑。

### 保存时怎么处理

| 你保存的内容 | 变量还不存在 | 变量已存在 |
|--------------|--------------|------------|
| 非空 | 新建 | 覆盖 |
| 空 | 建为空变量 | 保持原样不动 |

## 给其他插件（Remote API）

通过 Host 的 `customEnv` 服务调用（`ctx.get('customEnv')` 或已注入的 `ctx.customEnv`）。

**常用：按变量名**

```ts
const env = ctx.get('customEnv')

await env?.setVar('MY_KEY', 'value')              // 新建 → 默认分组；已存在则保留原分组
await env?.setVar('MY_KEY', 'value', someGroupId) // 同时指定/迁入分组
await env?.setVar('MY_KEY', '')                   // 仅当不存在时新建
await env?.removeVar('MY_KEY')

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '', group: someGroupId }, // B 已存在则跳过
])
await env?.removeVars(['A', 'B'])

const group = await env?.createGroup('社媒')
await env?.renameGroup(group!.id, '社交媒体')
await env?.deleteGroup(group!.id, { moveToDefault: true })
await env?.moveEntry(rowId, group!.id)
```

保留名会被拒绝（批量调用整批失败）。未知 group id 抛出 `custom-env/invalid-group`。

| 调用 | 用途 |
|------|------|
| `setVar(name, value, group?)` | 按名新建/覆盖。省略 `group`：新建进 `default`，已有保留分组；传入则指定/迁组 |
| `setVars([{ name, value, group? }, ...])` | 同上；同名后者覆盖 |
| `removeVar(name)` / `removeVars(names)` | 按名删除（并清 membership） |
| `createGroup(title)` | 新建自定义分组，返回 `{ id, title }` |
| `renameGroup(id, title)` | 重命名自定义分组（不可改 `default`） |
| `deleteGroup(id, { moveToDefault })` | 删除自定义分组；`true` 成员进默认分组，`false` 连同变量删除 |
| `moveEntry(id, groupId)` | 按设置页行 id 迁组 |

**设置页：按行 id**

| 调用 | 用途 |
|------|------|
| `list()` | 变量 + `groups`；每行含 `groupId` |
| `upsert(id, name, value, groupId?)` | 新建（`id` 为空；`groupId` 默认 `default`）或按 id 更新/重命名（不传 `groupId` 则保留分组） |
| `deleteEntry(id)` | 删除该行 |
| `restore(id)` | 恢复启动时的值；若是启动后新增的行则删除 |

**CLI**

| 调用 | 用途 |
|------|------|
| `cliStatus()` | 本 Host 的 `dsh` 是否可用 / 能否安装 |
| `cliInstall()` | 安装或修复该 CLI 入口 |

## 许可证

MIT
