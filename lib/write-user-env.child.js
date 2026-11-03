// src/os-user-env/macos.ts
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
var AGENT_LABEL = "ai.dsh.custom-env";
var AGENT_DIR = () => join(homedir(), "Library", "LaunchAgents");
var AGENT_PATH = () => join(AGENT_DIR(), `${AGENT_LABEL}.plist`);
var cached;
function escapeXml(value) {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;");
}
function buildPlist(entries) {
  const pairs = Object.entries(entries).map(([key, value]) => `    <key>${escapeXml(key)}</key>
    <string>${escapeXml(value)}</string>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/true</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>EnvironmentVariables</key>
  <dict>
${pairs}
  </dict>
</dict>
</plist>
`;
}
function launchctl(args) {
  const result = spawnSync("launchctl", args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`custom-env: launchctl ${args.join(" ")} failed${detail === "" ? "" : `: ${detail}`}`);
  }
}
function ensureCache() {
  if (cached !== void 0) return cached;
  cached = {};
  return cached;
}
function writeAgent(entries) {
  const path = AGENT_PATH();
  if (Object.keys(entries).length === 0) {
    if (existsSync(path)) {
      try {
        launchctl(["unload", path]);
      } catch (_error) {
      }
      unlinkSync(path);
    }
    return;
  }
  mkdirSync(AGENT_DIR(), { recursive: true });
  writeFileSync(path, buildPlist(entries), "utf8");
  try {
    launchctl(["unload", path]);
  } catch (_error) {
  }
  launchctl(["load", path]);
}
function writeMacosUserEnv(entries, platform = process.platform) {
  if (platform !== "darwin") return;
  const pairs = Object.entries(entries);
  if (pairs.length === 0) return;
  const map = ensureCache();
  for (const [name, value] of pairs) {
    map[name] = value;
    launchctl(["setenv", name, value]);
  }
  writeAgent(map);
}

// src/os-user-env/windows.ts
import { createRequire } from "node:module";
var HKEY_CURRENT_USER = 2147483649;
var KEY_SET_VALUE = 2;
var REG_SZ = 1;
var ERROR_SUCCESS = 0;
var bindings;
function loadBindings() {
  if (bindings !== void 0) return bindings;
  const require2 = createRequire(import.meta.url);
  const koffi = require2("koffi");
  const advapi32 = koffi.load("advapi32.dll");
  bindings = {
    openKey: advapi32.func(
      "long __stdcall RegOpenKeyExW(uintptr_t hKey, const char16_t *subKey, uint32_t options, uint32_t samDesired, _Out_ void **result)"
    ),
    queryValue: advapi32.func(
      "long __stdcall RegQueryValueExW(void *hKey, const char16_t *valueName, void *reserved, _Inout_ uint32_t *type, uint8_t *data, _Inout_ uint32_t *cbData)"
    ),
    setValue: advapi32.func(
      "long __stdcall RegSetValueExW(void *hKey, const char16_t *valueName, uint32_t reserved, uint32_t type, const uint8_t *data, uint32_t cbData)"
    ),
    deleteValue: advapi32.func(
      "long __stdcall RegDeleteValueW(void *hKey, const char16_t *valueName)"
    ),
    closeKey: advapi32.func("long __stdcall RegCloseKey(void *hKey)")
  };
  return bindings;
}
function encodeRegSz(value) {
  return Buffer.from(`${value}\0`, "utf16le");
}
function writeWindowsUserEnv(entries, platform = process.platform) {
  if (platform !== "win32") return;
  const pairs = Object.entries(entries);
  if (pairs.length === 0) return;
  const api = loadBindings();
  const keySlot = [null];
  const openStatus = api.openKey(HKEY_CURRENT_USER, "Environment", 0, KEY_SET_VALUE, keySlot);
  if (openStatus !== ERROR_SUCCESS) {
    throw new Error(`custom-env: RegOpenKeyExW failed (Win32 ${openStatus})`);
  }
  const hKey = keySlot[0];
  try {
    for (const [name, value] of pairs) {
      const data = encodeRegSz(value);
      const status = api.setValue(hKey, name, 0, REG_SZ, data, data.length);
      if (status !== ERROR_SUCCESS) {
        throw new Error(`custom-env: RegSetValueExW(${name}) failed (Win32 ${status})`);
      }
    }
  } finally {
    api.closeKey(hKey);
  }
}

// src/os-user-env/index.ts
function writeUserEnv(entries) {
  writeWindowsUserEnv(entries);
  writeMacosUserEnv(entries);
}

// src/os-user-env/write-user-env.child.ts
var chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
}
var raw = Buffer.concat(chunks).toString("utf8").trim();
if (raw === "") process.exit(0);
try {
  const entries = JSON.parse(raw);
  writeUserEnv(entries);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`custom-env child: ${message}
`);
  process.exitCode = 1;
}
