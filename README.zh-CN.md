# dsh-custom-env

[English](README.md) | 中文

社区维护的 DeepSeek Harness（DSH）插件：在 **设置 → 环境变量** 中管理 `$DSH_HOME/.env`。非 DeepSeek AI 官方产品。

保存后立即写入 Host 的 `process.env`，并在 **Windows / macOS** 同步到用户环境（新开终端才能看到 OS 侧变更）。不同步 Linux 用户环境。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-0f766e.svg)](https://github.com/ownduck/dsh-custom-env)

## 功能

- 设置页对 `$DSH_HOME/.env` 增删改（文件不存在时自动创建）
- 热写到当前 Host 进程
- Windows / macOS 用户环境同步
- 拒绝 bootstrap 名（`PATH`、`DSH_*`、`XDG_*` 等），与 app-boot 对 `.env` 的限制一致

## 前置条件

- 已安装可用的 DeepSeek Harness，且终端里能运行 `dsh`（CLI 或 Desktop 自带 CLI）
- 下文示例使用 `web` profile；请换成你的目标 profile
- `desktop` profile 由 Electron 独占——请用应用内插件管理，或手动改该 profile 的 `package.json`

## 安装

本仓库已包含可运行的 `lib/`。**不发 npmjs 也能从 GitHub 安装。**

### 从 GitHub 安装（未发 npm 时推荐）

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add github:ownduck/dsh-custom-env
dsh --profile web --dump-config
```

等价写法：

```powershell
dsh plugin --profile web add https://github.com/ownduck/dsh-custom-env.git
```

配置输出中应出现 `# == dsh-custom-env` 层和 `custom-env` 插件行。然后重启 DSH Web，并在浏览器硬刷新。

### 让 Agent 帮你安装

```text
请将 DSH 插件 github:ownduck/dsh-custom-env 安装到本机 web profile，执行：dsh plugin --profile web add github:ownduck/dsh-custom-env。安装后执行 dsh --profile web --dump-config，确认配置包含 dsh-custom-env / custom-env，并告诉我如何重新加载 DSH，以及如何打开「设置 → 环境变量」。
```

### 从本地克隆安装（`file:` / `.`）

```powershell
git clone https://github.com/ownduck/dsh-custom-env.git
cd dsh-custom-env
dsh plugin --profile web add .
# 或：dsh plugin --profile web add file:F:/path/to/dsh-custom-env
dsh --profile web --dump-config
```

### 从 npm 安装（可选，发布后）

若已发布到 npm：

```powershell
dsh plugin --profile web add dsh-custom-env@latest --registry=https://registry.npmjs.org/
```

## 卸载 / 重装

```powershell
dsh plugin --profile web remove dsh-custom-env
dsh plugin --profile web add github:ownduck/dsh-custom-env
```

本地 `file:` 开发：改 `src` 后重建 `lib/`，再重启 DSH。只有改了 `package.json` / `cordis.patch.yml` 才需要重新 `plugin add`。

## 使用

1. 打开 **设置 → 环境变量**
2. 增删改变量
3. Host 进程立刻生效；OS 用户环境需 **新开** 终端 / 应用

不要把 bootstrap 名写进 `.env`。应用配置用普通名字即可。名称含 `KEY` / `SECRET` / `TOKEN` 时仍会被现有 harness 策略从模型可见 shell 中 scrub。

本插件**不**安装全局 `dsh` 命令。请用 Desktop「管理 dsh 命令…」或 `npm install -g`。

## GitHub 与 npmjs

| 渠道 | 够不够用 | 安装命令 |
| --- | --- | --- |
| **只推 GitHub** | 够 | `dsh plugin add github:ownduck/dsh-custom-env` |
| **再发 npmjs** | 可选 | `dsh plugin add dsh-custom-env` |

推到 GitHub 即可分享与安装。发 npmjs 只是可选便利（短包名、版本号、徽章），与社区插件同时维护 GitHub + npm 的做法类似。

## 许可证

MIT
