/** Locale dictionaries for the environment-variables settings section. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.env'

/** Keys in the environment settings dictionaries. */
export type EnvSettingsKey =
  | 'nav'
  | 'title'
  | 'empty'
  | 'name'
  | 'value'
  | 'actions'
  | 'confirm'
  | 'cancel'
  | 'remove'
  | 'removeConfirmTitle'
  | 'removeConfirm'
  | 'restore'
  | 'close'
  | 'namePlaceholder'
  | 'valuePlaceholder'
  | 'loading'
  | 'error'
  | 'invalidName'
  | 'restartRequired'
  | 'cliTitle'
  | 'cliActiveMissing'
  | 'cliInstall'
  | 'cliMacConflict'
  | 'cliInstallError'
  | 'cliReasonUnresolved'
  | 'cliReasonUnsupported'

/** English copy. */
export const en: Record<EnvSettingsKey, string> = {
  nav: 'Environment',
  title: 'Environment',
  empty: 'No variables',
  name: 'Name',
  value: 'Value',
  actions: 'Actions',
  confirm: 'Confirm',
  cancel: 'Cancel',
  remove: 'Delete',
  removeConfirmTitle: 'Delete variable',
  removeConfirm: 'Delete {name}?',
  restore: 'Restore original',
  close: 'Close',
  namePlaceholder: 'MY_VAR',
  valuePlaceholder: 'value',
  loading: 'Loading…',
  error: 'Update failed',
  invalidName: 'Invalid name',
  restartRequired: 'Restart the client',
  cliTitle: 'dsh',
  cliActiveMissing: 'Not found',
  cliInstall: 'Install',
  cliMacConflict: 'Replaces /usr/local/bin/dsh',
  cliInstallError: 'Install failed',
  cliReasonUnresolved: 'Install unavailable',
  cliReasonUnsupported: 'Windows / macOS only',
}

/** Chinese copy. */
export const zh: Record<EnvSettingsKey, string> = {
  nav: '环境变量',
  title: '环境变量',
  empty: '暂无变量',
  name: '名称',
  value: '值',
  actions: '操作',
  confirm: '确定',
  cancel: '取消',
  remove: '删除',
  removeConfirmTitle: '删除变量',
  removeConfirm: '删除 {name}？',
  restore: '恢复原值',
  close: '关闭',
  namePlaceholder: 'MY_VAR',
  valuePlaceholder: '值',
  loading: '加载中…',
  error: '更新失败',
  invalidName: '名称无效',
  restartRequired: '需重启客户端',
  cliTitle: 'dsh',
  cliActiveMissing: '未找到',
  cliInstall: '安装',
  cliMacConflict: '将替换 /usr/local/bin/dsh',
  cliInstallError: '安装失败',
  cliReasonUnresolved: '无法安装',
  cliReasonUnsupported: '仅 Windows / macOS',
}
