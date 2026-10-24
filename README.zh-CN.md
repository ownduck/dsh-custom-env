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
- **dsh 命令**区块：展示用户 PATH 上的 `dsh` 与启动本 Host 的期望启动器；不一致时显示 **安装** 按钮（Windows 用户 PATH / macOS `/usr/local/bin/dsh`）。无卸载按钮。

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
2. **草稿编辑**：点 **确定** 才写入 `$DSH_HOME/.env`（并热写 Host/OS）；**取消** 只恢复输入框
3. 确定后行旁提示需重启——**新增**标为新增项；相对 Host 启动值的 **修改** 另有 **恢复**（写回启动时的值）
4. 完整生效请重启 DSH / 新开终端；Host 重启后提示与恢复按钮消失
5. 在 **dsh 命令**区块对比 PATH 与期望路径；仅在出现按钮时点击 **安装**

不要把 bootstrap 名（含 `PATH`）写进 `.env`。应用配置用普通名字即可。名称含 `KEY` / `SECRET` / `TOKEN` 时仍会被现有 harness 策略从模型可见 shell 中 scrub。

### 在设置页安装 `dsh` CLI

期望路径由 **当前 Host 的启动方式** 推断（Desktop 打包的 `resources/runtime/cli/bin`，或 Node/源码启动的 `argv` 启动器）。

| 平台 | 安装行为 | 冲突说明 |
| --- | --- | --- |
| **Windows** | 将期望 bin 目录写入用户 `Path`（注册表）。所有权键：`Software\dsh-custom-env\Command`（不用 DeepSeekHarness）。 | 可与 Desktop 的 PATH 条目并存；新终端里谁排前用谁。 |
| **macOS** | 写符号链接 `/usr/local/bin/dsh` → 期望启动器。收据：`.dsh-custom-env-command.json`。 | **与 Desktop「管理 dsh 命令…」同一路径**，可能覆盖其链接。 |
| **Linux** | 仅展示状态，无安装按钮。 | — |

安装后请 **新开** 终端。本插件不会调用 Desktop `app.relaunch`。

## 开发

```powershell
cd dsh-custom-env
pnpm test   # 或：node --import tsx/esm --test tests/*.spec.ts
pnpm build  # 重建 lib/（client 打包依赖旁路的 vertax-work esbuild）
```

测试在 [`tests/`](tests/)（`env-file.spec.ts`、`cli-path.spec.ts`）。文档即本 README 中英双语。

## GitHub 与 npmjs

| 渠道 | 够不够用 | 安装命令 |
| --- | --- | --- |
| **只推 GitHub** | 够 | `dsh plugin add github:ownduck/dsh-custom-env` |
| **再发 npmjs** | 可选 | `dsh plugin add dsh-custom-env` |

推到 GitHub 即可分享与安装。发 npmjs 只是可选便利（短包名、版本号、徽章），与社区插件同时维护 GitHub + npm 的做法类似。

## 许可证

MIT
