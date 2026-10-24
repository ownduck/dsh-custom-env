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
}
