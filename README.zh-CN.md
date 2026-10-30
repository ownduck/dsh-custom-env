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
3. **恢复** 可回到本次应用启动时的值
4. 启动时先注入当前 Host 的 `process.env`；写入用户环境（注册表 / launchctl）会延后到启动路径之后，且不会广播。其它工具若要读到，请注销/重启后再开终端
5. 仅在出现 **安装** 时使用：把本 Host 的 `dsh` 接到用户 PATH（Windows / macOS）

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

await env?.setVar('MY_KEY', 'value')  // 新建或覆盖
await env?.setVar('MY_KEY', '')       // 仅当不存在时新建
await env?.removeVar('MY_KEY')

await env?.setVars([
  { name: 'A', value: '1' },
  { name: 'B', value: '' },           // B 已存在则跳过
])
await env?.removeVars(['A', 'B'])
```

保留名会被拒绝（批量调用整批失败）。

**设置页：按行 id**

| 调用 | 用途 |
|------|------|
| `list()` | 列出当前变量与行 id |
| `upsert(id, name, value)` | 新建（`id` 为空）或更新/重命名一行 |
| `deleteEntry(id)` | 删除该行 |
| `restore(id)` | 恢复启动时的值；若是启动后新增的行则删除 |

**CLI**

| 调用 | 用途 |
|------|------|
| `cliStatus()` | 本 Host 的 `dsh` 是否可用 / 能否安装 |
| `cliInstall()` | 安装或修复该 CLI 入口 |

## 许可证

MIT
