/** Locale dictionaries for the environment-variables settings section. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.env'

/** Keys in the environment settings dictionaries. */
export type EnvSettingsKey =
  | 'nav'
  | 'title'
  | 'intro'
  | 'path'
  | 'empty'
  | 'name'
  | 'value'
  | 'add'
  | 'save'
  | 'remove'
  | 'namePlaceholder'
  | 'valuePlaceholder'
  | 'loading'
  | 'error'
  | 'invalidName'
  | 'osSync'
  | 'cliTitle'
  | 'cliIntro'
  | 'cliActive'
  | 'cliActiveMissing'
  | 'cliExpected'
  | 'cliExpectedMissing'
  | 'cliMatches'
  | 'cliInstall'
  | 'cliInstallHint'
  | 'cliMacConflict'
  | 'cliInstallOk'
  | 'cliInstallError'
  | 'cliReasonUnresolved'
  | 'cliReasonUnsupported'

/** English copy. */
export const en: Record<EnvSettingsKey, string> = {
  nav: 'Environment',
  title: 'Environment variables',
  intro: 'Values are stored in $DSH_HOME/.env, applied to this Host immediately, and synced to your OS user environment on Windows and macOS. New terminals see OS changes after they start.',
  path: 'File: {path}',
  empty: 'No variables yet. Add a name and value below.',
  name: 'Name',
  value: 'Value',
  add: 'Add',
  save: 'Save',
  remove: 'Remove',
  namePlaceholder: 'MY_VAR',
  valuePlaceholder: 'value',
  loading: 'Loading…',
  error: 'Could not update environment variables.',
  invalidName: 'Use a letter or underscore first; letters, digits, and underscores after. Bootstrap names (PATH, DSH_*, …) are blocked.',
  osSync: 'Synced to OS user environment (Windows / macOS).',
  cliTitle: 'dsh command',
  cliIntro: 'Compares the `dsh` on your user PATH with the launcher that started this Host.',
  cliActive: 'On PATH: {path}',
  cliActiveMissing: 'On PATH: not found',
  cliExpected: 'Expected for this Host: {path}',
  cliExpectedMissing: 'Expected for this Host: could not resolve',
  cliMatches: 'PATH already points at this Host’s launcher.',
  cliInstall: 'Install dsh for this Host',
  cliInstallHint: 'Opens new terminals with this Host’s launcher. Restart existing terminals to pick up PATH changes.',
  cliMacConflict: 'On macOS this writes /usr/local/bin/dsh and may replace the Desktop “Manage dsh Command…” link.',
  cliInstallOk: 'Installed. Open a new terminal to use the updated dsh.',
  cliInstallError: 'Could not install the dsh command.',
  cliReasonUnresolved: 'This Host’s launcher path could not be inferred, so install is unavailable.',
  cliReasonUnsupported: 'CLI install is supported on Windows and macOS only.',
}

/** Chinese copy. */
export const zh: Record<EnvSettingsKey, string> = {
  nav: '环境变量',
  title: '环境变量',
  intro: '保存在 $DSH_HOME/.env，立即写入当前 Host 进程，并在 Windows / macOS 同步到用户环境。新开的终端才能看到 OS 侧变更。',
  path: '文件：{path}',
  empty: '还没有变量。在下方添加名称和值。',
  name: '名称',
  value: '值',
  add: '添加',
  save: '保存',
  remove: '删除',
  namePlaceholder: 'MY_VAR',
  valuePlaceholder: '值',
  loading: '加载中…',
  error: '无法更新环境变量。',
  invalidName: '名称须以字母或下划线开头，其后可为字母、数字、下划线；禁止 PATH、DSH_* 等启动相关名。',
  osSync: '已同步到操作系统用户环境（Windows / macOS）。',
  cliTitle: 'dsh 命令',
  cliIntro: '对比用户 PATH 上的 `dsh` 与启动当前 Host 所用的启动器。',
  cliActive: 'PATH 上：{path}',
  cliActiveMissing: 'PATH 上：未找到',
  cliExpected: '当前 Host 期望：{path}',
  cliExpectedMissing: '当前 Host 期望：无法推断',
  cliMatches: 'PATH 已指向本 Host 的启动器。',
  cliInstall: '为本 Host 安装 dsh',
  cliInstallHint: '新开终端将使用本 Host 的启动器。已打开的终端需重启后才能看到 PATH 变更。',
  cliMacConflict: '在 macOS 上会写入 /usr/local/bin/dsh，可能覆盖 Desktop「管理 dsh 命令…」安装的链接。',
  cliInstallOk: '已安装。请新开终端以使用更新后的 dsh。',
  cliInstallError: '无法安装 dsh 命令。',
  cliReasonUnresolved: '无法推断本 Host 的启动器路径，因此不能安装。',
  cliReasonUnsupported: '仅支持在 Windows 与 macOS 上安装 CLI。',
}
