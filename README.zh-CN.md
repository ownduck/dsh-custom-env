# dsh-custom-env

[English](README.md) | 中文

社区 DeepSeek Harness 插件：在 **设置 → 环境变量** 管理 `$DSH_HOME/.env`。非 DeepSeek AI 官方产品。

保存后立即作用于 Host，并同步到 Windows / macOS 用户环境（新开终端可见 OS 侧变更）。不同步 Linux 用户环境。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 功能

- 设置页管理 `$DSH_HOME/.env`
- 热写当前 Host 进程
- 同步 Windows / macOS 用户环境
- 拒绝 bootstrap 名（`PATH`、`DSH_*`、`XDG_*` 等）
- 可选为本 Host **安装** `dsh` CLI（Windows / macOS）

## 安装

需已安装 DSH 且可用 `dsh` CLI。profile 选 `desktop` 或 `web`。

```powershell
dsh plugin --profile desktop add @woosau/dsh-custom-env
```

```powershell
dsh plugin --profile web add @woosau/dsh-custom-env
```

GitHub：`dsh plugin --profile desktop add github:ownduck/dsh-custom-env`

若 `plugin` 报 profile `package.json` 的 `EPERM`，先退出 Desktop。从 GitHub 安装时，profile 的 `pnpm-workspace.yaml` 可能需要 `allowBuilds.koffi: true`（原生依赖 `koffi`）。然后重启 DSH，打开 **设置 → 环境变量**。

## 卸载

```powershell
dsh plugin --profile desktop remove @woosau/dsh-custom-env
```

## 使用

1. 打开 **设置 → 环境变量**
2. 草稿编辑：**确定** 写入 `.env` 并热写 Host/OS；**取消** 只恢复输入框
3. 确定后新增/修改行旁有重启提示；**恢复** 可写回 Host 启动时的值
4. 完整生效请重启 DSH 或新开终端
5. **dsh** 区块仅在出现按钮时点 **安装**（Windows 用户 PATH / macOS `/usr/local/bin/dsh`；macOS 上可能覆盖 Desktop 的链接）

不要把 bootstrap 名（含 `PATH`）写进 `.env`。

## 插件 API

任意 Host 插件可按**变量名**调用 `customEnv`（无需 Settings 行 id）：

```ts
const env = ctx.get('customEnv') // 或已注入时用 ctx.customEnv
await env?.setVar('MY_KEY', 'value') // 新增或覆盖
await env?.setVar('MY_KEY', '')      // 空值写入 MY_KEY=
await env?.removeVar('MY_KEY')       // 返回是否删掉了 .env 行

await env?.setVars([                 // 一次写文件；同名后者覆盖
  { name: 'A', value: '1' },
  { name: 'B', value: '' },
])
await env?.removeVars(['A', 'B'])    // 返回删掉的 .env 行数
```

bootstrap / 保留名（`PATH`、`DSH_*`、`XDG_*` 等）会被拒绝（批量接口整批失败）。写入会更新 `$DSH_HOME/.env`、热写 `process.env`，并同步 Windows / macOS 用户环境。

## 许可证

MIT
