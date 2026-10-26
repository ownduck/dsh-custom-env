/**
 * Persist or delete variables in the Windows user environment (HKCU\\Environment)
 * via koffi + advapi32/user32 — same approach as the former in-tree custom-env.
 */

import { createRequire } from 'node:module'

type Koffi = typeof import('koffi')['default']

/** Predefined HKCU handle (same numeric value on Win32 and Win64). */
const HKEY_CURRENT_USER = 0x80000001
const KEY_SET_VALUE = 0x0002
const REG_SZ = 1
const ERROR_SUCCESS = 0
const ERROR_FILE_NOT_FOUND = 2
const HWND_BROADCAST = 0xffff
const WM_SETTINGCHANGE = 0x001a
const SMTO_ABORTIFHUNG = 0x0002

/** Win32 registry and broadcast calls used to publish user environment values. */
export interface WindowsUserEnvBindings {
  readonly openKey: (
    hKey: number,
    subKey: string,
    options: number,
    samDesired: number,
    result: [unknown],
  ) => number
  readonly setValue: (
    hKey: unknown,
    valueName: string,
    reserved: number,
    type: number,
    data: Buffer,
    cbData: number,
  ) => number
  readonly deleteValue: (hKey: unknown, valueName: string) => number
  readonly closeKey: (hKey: unknown) => number
  readonly sendMessageTimeout: (
    hWnd: number,
    msg: number,
    wParam: number,
    lParam: string,
    flags: number,
    timeoutMs: number,
    result: [number],
  ) => number
}

let bindings: WindowsUserEnvBindings | undefined

function loadBindings(): WindowsUserEnvBindings {
  if (bindings !== undefined) return bindings
  const require = createRequire(import.meta.url)
  const koffi = require('koffi') as Koffi
  const advapi32 = koffi.load('advapi32.dll')
  const user32 = koffi.load('user32.dll')
  bindings = {
    openKey: advapi32.func(
      'long __stdcall RegOpenKeyExW(uintptr_t hKey, const char16_t *subKey, uint32_t options, uint32_t samDesired, _Out_ void **result)',
    ) as WindowsUserEnvBindings['openKey'],
    setValue: advapi32.func(
      'long __stdcall RegSetValueExW(void *hKey, const char16_t *valueName, uint32_t reserved, uint32_t type, const uint8_t *data, uint32_t cbData)',
    ) as WindowsUserEnvBindings['setValue'],
    deleteValue: advapi32.func(
      'long __stdcall RegDeleteValueW(void *hKey, const char16_t *valueName)',
    ) as WindowsUserEnvBindings['deleteValue'],
    closeKey: advapi32.func('long __stdcall RegCloseKey(void *hKey)') as WindowsUserEnvBindings['closeKey'],
    sendMessageTimeout: user32.func(
      'intptr_t __stdcall SendMessageTimeoutW(uintptr_t hWnd, uint32_t msg, uintptr_t wParam, const char16_t *lParam, uint32_t flags, uint32_t timeout, _Out_ uintptr_t *result)',
    ) as WindowsUserEnvBindings['sendMessageTimeout'],
  }
  return bindings
}

/**
 * Install FFI bindings for tests (skips loading koffi).
 * @param next - Mock bindings, or `undefined` to clear the cache.
 */
export function setWindowsUserEnvBindingsForTests(next: WindowsUserEnvBindings | undefined): void {
  bindings = next
}

/**
 * Encode a REG_SZ payload (UTF-16LE including trailing NUL).
 * @param value - String to store.
 * @returns Buffer accepted by RegSetValueExW.
 */
export function encodeRegSz(value: string): Buffer {
  return Buffer.from(`${value}\0`, 'utf16le')
}

function broadcastEnvironmentChange(api: WindowsUserEnvBindings): void {
  const broadcastResult: [number] = [0]
  api.sendMessageTimeout(
    HWND_BROADCAST,
    WM_SETTINGCHANGE,
    0,
    'Environment',
    SMTO_ABORTIFHUNG,
    1_000,
    broadcastResult,
  )
}

/**
 * Write entries into HKCU\\Environment and broadcast WM_SETTINGCHANGE.
 * No-op on non-Windows hosts or when `entries` is empty.
 * @param entries - Variable map to persist.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function persistWindowsUserEnv(
  entries: Readonly<Record<string, string>>,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'win32') return
  const pairs = Object.entries(entries)
  if (pairs.length === 0) return

  const api = loadBindings()
  const keySlot: [unknown] = [null]
  const openStatus = api.openKey(HKEY_CURRENT_USER, 'Environment', 0, KEY_SET_VALUE, keySlot)
  if (openStatus !== ERROR_SUCCESS) {
    throw new Error(`custom-env: RegOpenKeyExW failed (Win32 ${openStatus})`)
  }
  const hKey = keySlot[0]
  try {
    for (const [name, value] of pairs) {
      const data = encodeRegSz(value)
      const status = api.setValue(hKey, name, 0, REG_SZ, data, data.length)
      if (status !== ERROR_SUCCESS) {
        throw new Error(`custom-env: RegSetValueExW(${name}) failed (Win32 ${status})`)
      }
    }
  } finally {
    api.closeKey(hKey)
  }

  broadcastEnvironmentChange(api)
}

/**
 * Delete one user environment value from HKCU\\Environment.
 * Missing values are ignored.
 * @param name - Variable name to remove.
 * @param platform - Override for tests; defaults to `process.platform`.
 */
export function removeWindowsUserEnv(
  name: string,
  platform: NodeJS.Platform = process.platform,
): void {
  if (platform !== 'win32') return

  const api = loadBindings()
  const keySlot: [unknown] = [null]
  const openStatus = api.openKey(HKEY_CURRENT_USER, 'Environment', 0, KEY_SET_VALUE, keySlot)
  if (openStatus !== ERROR_SUCCESS) {
    throw new Error(`custom-env: RegOpenKeyExW failed (Win32 ${openStatus})`)
  }
  const hKey = keySlot[0]
  try {
    const status = api.deleteValue(hKey, name)
    if (status !== ERROR_SUCCESS && status !== ERROR_FILE_NOT_FOUND) {
      throw new Error(`custom-env: RegDeleteValueW(${name}) failed (Win32 ${status})`)
    }
  } finally {
    api.closeKey(hKey)
  }

  broadcastEnvironmentChange(api)
}
