# dsh-custom-env

[English](README.md) | 中文

社区 DeepSeek Harness 插件：在 **设置 → 环境变量** 管理 `$DSH_HOME/.env`。非 DeepSeek AI 官方产品。

写入会更新 `.env`、热写 `process.env`，并同步 Windows / macOS 用户环境。不同步 Linux 用户环境。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 安装

需已安装 DSH 且可用 `dsh` CLI（`desktop` 或 `web` profile）。

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
# 或: dsh plugin --profile web add @woosau/dsh-custom-env
# 或: dsh plugin --profile desktop add github:ownduck/dsh-custom-env
```

若 profile `package.json` 报 `EPERM`，先退出 Desktop。从 GitHub 安装时，profile 的 `pnpm-workspace.yaml` 可能需要 `allowBuilds.koffi: true`。重启 DSH 后打开 **设置 → 环境变量**。

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## 设置页

1. 草稿编辑 → **确定** 写入 `.env` + Host/OS；**取消** 只恢复输入框
2. **恢复** 写回 Host 启动时该行的值
3. 完整 OS 生效请重启 DSH 或新开终端
4. 可选 **安装** 本 Host 的 `dsh` CLI（Windows 用户 PATH / macOS `/usr/local/bin/dsh`）

bootstrap 名（`PATH`、`DSH_*`、`XDG_*` 等）会被拒绝。

## 写入规则

| 待写入 | 键不存在 | 键已存在（`.env` 或系统用户环境） |
|--------|----------|-----------------------------------|
| 非空 | 创建 | 覆盖 |
| 空 | 写入 `NAME=` | **跳过**（保留已有，含已有空值） |

## Remote API

Host 插件通过 `customEnv` 服务调用（`ctx.get('customEnv')` 或已注入的 `ctx.customEnv`）。设置页用 id 系接口；其他插件一般用按名的 `setVar` / `removeVar`。

### 按变量名

```ts
const env = ctx.get('customEnv')

await env?.setVar('MY_KEY', 'value')   // 新增 / 覆盖
await env?.setVar('MY_KEY', '')        // 仅当不存在时创建
await env?.removeVar('MY_KEY')         // → boolean（是否删掉 .env 行）

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '' },            // B 已存在则跳过
])
await env?.removeVars(['A', 'B'])      // → 删掉的 .env 行数
```

非法 / bootstrap 名会使整批失败。

### 按设置页行 id

| Remote | 作用 |
|--------|------|
| `list()` | `{ path, exists, entries[] }` — 文件顺序；含 `id` / `name` / `value` / `kind` / `previous` |
| `upsert(id, name, value)` | `id === ''` 新建；否则更新/重命名该行 → snapshot |
| `deleteEntry(id)` | 按 id 删除 → snapshot |
| `restore(id)` | 写回 Host 启动时的名/值（强制写入）；若启动后新增则删除 → snapshot |

### CLI

| Remote | 作用 |
|--------|------|
| `cliStatus()` | 本 Host 的 `dsh` CLI 是否已安装 / 是否提供安装 |
| `cliInstall()` | 安装或修复 CLI 链接（Windows / macOS） |

## 许可证

MIT
