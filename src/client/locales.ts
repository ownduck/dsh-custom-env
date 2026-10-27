/** `settings.env` namespace dictionaries for the environment settings section. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.env' as const

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'panel.nav': '环境变量',
  'panel.title': '环境变量',
  'panel.empty': '暂无变量',
  'panel.loading': '加载中…',

  'field.name': '名称',
  'field.value': '值',
  'field.actions': '操作',
  'field.namePlaceholder': 'MY_VAR',
  'field.valuePlaceholder': '值',

  'action.confirm': '确定',
  'action.cancel': '取消',
  'action.remove': '删除',
  'action.removeConfirmTitle': '删除变量',
  'action.removeConfirm': '删除 {name}？',
  'action.restore': '恢复原值',
  'action.close': '关闭',

  'status.restartRequired': '需重启客户端',

  'cli.title': 'dsh',
  'cli.activeMissing': '未找到',
  'cli.install': '安装',
  'cli.macConflict': '将替换 /usr/local/bin/dsh',

  'error.generic': '更新失败',
  'error.invalidName': '名称无效',
  'error.invalidValue': '值无效',
  'error.restoreFailed': '恢复失败',
  'error.cliInstall': '安装失败',
  'error.cliUnresolved': '无法安装',
  'error.cliUnsupported': '仅 Windows / macOS',
} satisfies Record<string, string>

/** The settings.env namespace key union. */
export type EnvSettingsKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'panel.nav': 'Environment',
  'panel.title': 'Environment',
  'panel.empty': 'No variables',
  'panel.loading': 'Loading…',

  'field.name': 'Name',
  'field.value': 'Value',
  'field.actions': 'Actions',
  'field.namePlaceholder': 'MY_VAR',
  'field.valuePlaceholder': 'value',

  'action.confirm': 'Confirm',
  'action.cancel': 'Cancel',
  'action.remove': 'Delete',
  'action.removeConfirmTitle': 'Delete variable',
  'action.removeConfirm': 'Delete {name}?',
  'action.restore': 'Restore original',
  'action.close': 'Close',

  'status.restartRequired': 'Restart the client',

  'cli.title': 'dsh',
  'cli.activeMissing': 'Not found',
  'cli.install': 'Install',
  'cli.macConflict': 'Replaces /usr/local/bin/dsh',

  'error.generic': 'Update failed',
  'error.invalidName': 'Invalid name',
  'error.invalidValue': 'Invalid value',
  'error.restoreFailed': 'Restore failed',
  'error.cliInstall': 'Install failed',
  'error.cliUnresolved': 'Install unavailable',
  'error.cliUnsupported': 'Windows / macOS only',
} satisfies Record<EnvSettingsKey, string>
