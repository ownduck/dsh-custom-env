var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/index.ts
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

// src/cli-path/inspect-active.ts
import { accessSync, constants, existsSync as existsSync2, lstatSync, readlinkSync } from "node:fs";
import { isAbsolute as isAbsolute2, join as join2 } from "node:path";

// src/cli-path/paths.ts
import { existsSync } from "node:fs";
import { basename, dirname, isAbsolute, join, normalize, resolve, sep } from "node:path";
function launcherName(platform = process.platform) {
  return platform === "win32" ? "dsh.cmd" : "dsh";
}
function normalizeComparable(path, platform = process.platform) {
  const expanded = path.trim().replace(/^"|"$/gu, "");
  try {
    const full = isAbsolute(expanded) ? resolve(expanded) : expanded;
    const trimmed = full.replace(/[/\\]+$/u, "");
    return platform === "win32" ? trimmed.toUpperCase() : trimmed;
  } catch {
    return platform === "win32" ? expanded.toUpperCase() : expanded;
  }
}
function findElectronResources(execPath, platform = process.platform, exists = existsSync) {
  const dir = dirname(execPath);
  const candidates = [
    join(dir, "resources"),
    join(dir, "..", "Resources"),
    join(dir, "..", "resources")
  ];
  const name = launcherName(platform);
  for (const candidate of candidates) {
    const cliBin = join(candidate, "runtime", "cli", "bin", name);
    if (exists(cliBin)) return resolve(candidate);
  }
  return void 0;
}
function findLauncherDirectory(start, platform = process.platform, maxHops = 8, exists = existsSync) {
  let current = resolve(start);
  const name = launcherName(platform);
  for (let i = 0; i < maxHops; i += 1) {
    const asFile = join(dirname(current), name);
    if (exists(asFile) && basename(asFile) === name) return dirname(asFile);
    const asDir = join(current, name);
    if (exists(asDir)) return current;
    const inBin = join(current, "bin", name);
    if (exists(inBin)) return join(current, "bin");
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return void 0;
}
function looksLikeCliEntry(argv1) {
  if (argv1 === void 0 || argv1 === "") return false;
  const base = basename(argv1).toLowerCase();
  return base === "dsh" || base === "dsh.cmd" || base === "dsh.js" || base === "cli.js" || base === "cli.mjs" || base.endsWith(".js") && argv1.replaceAll("\\", "/").includes("/dsh");
}

// src/cli-path/inspect-active.ts
var MAC_DESTINATION = "/usr/local/bin/dsh";
function inspectActiveCli(options = {}) {
  const platform = options.platform ?? process.platform;
  const exists = options.exists ?? existsSync2;
  const isExecutable = options.isExecutable ?? ((path) => {
    try {
      accessSync(path, constants.X_OK);
      return true;
    } catch {
      return exists(path);
    }
  });
  const readLink = options.readLink ?? ((path) => {
    try {
      if (!lstatSync(path).isSymbolicLink()) return void 0;
      return readlinkSync(path);
    } catch {
      return void 0;
    }
  });
  if (platform === "win32") {
    return inspectWindows(options, exists);
  }
  return inspectPosix(platform, options, exists, isExecutable, readLink);
}
function inspectWindows(options, exists) {
  const machine = options.machinePath ?? readWindowsMachinePath();
  const user = options.pathEnv ?? readWindowsUserPath();
  const combined = `${machine};${user}`;
  const extensions = (options.pathext ?? process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").map((ext) => ext.trim()).filter((ext) => ext !== "");
  const searchExt = [".ps1", ...extensions];
  for (const part of combined.split(";")) {
    const directory = expandWindowsPath(part.trim().replace(/^"|"$/gu, ""));
    if (directory === "" || !isAbsolute2(directory)) continue;
    for (const extension of searchExt) {
      const candidate = join2(directory, `dsh${extension}`);
      try {
        if (exists(candidate)) return { path: candidate, symlinkTarget: void 0 };
      } catch {
      }
    }
  }
  return { path: void 0, symlinkTarget: void 0 };
}
function inspectPosix(platform, options, exists, isExecutable, readLink) {
  const pathEnv = options.pathEnv ?? process.env.PATH ?? "";
  const name = launcherName(platform);
  for (const part of pathEnv.split(":")) {
    const directory = part.trim();
    if (directory === "") continue;
    const candidate = join2(directory, name);
    try {
      if (!exists(candidate)) continue;
      if (!isExecutable(candidate) && platform !== "darwin") continue;
      const symlinkTarget = readLink(candidate);
      return { path: candidate, symlinkTarget };
    } catch {
    }
  }
  if (platform === "darwin" && exists(MAC_DESTINATION)) {
    return { path: MAC_DESTINATION, symlinkTarget: readLink(MAC_DESTINATION) };
  }
  return { path: void 0, symlinkTarget: void 0 };
}
function readWindowsUserPath() {
  return process.env.Path ?? process.env.PATH ?? "";
}
function readWindowsMachinePath() {
  return "";
}
function expandWindowsPath(value) {
  return value.replace(/%([^%]+)%/gu, (_match, name) => process.env[name] ?? `%${name}%`);
}
function activeMatchesExpected(active, expectedLauncher, platform = process.platform) {
  if (active.path === void 0) return false;
  if (platform === "darwin") {
    const target = active.symlinkTarget;
    if (target !== void 0 && target !== "") {
      const resolved = target.startsWith("/") ? target : join2(active.path, "..", target);
      if (normalizeComparable(resolved, platform) === normalizeComparable(expectedLauncher, platform)) {
        return true;
      }
    }
  }
  return normalizeComparable(active.path, platform) === normalizeComparable(expectedLauncher, platform);
}

// src/cli-path/macos.ts
import { execFile } from "node:child_process";
import { existsSync as existsSync3, lstatSync as lstatSync2, mkdirSync, readFileSync, readlinkSync as readlinkSync2, renameSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname as dirname2, isAbsolute as isAbsolute3, join as join3 } from "node:path";
import { promisify } from "node:util";
var execFileAsync = promisify(execFile);
var MAC_CLI_DESTINATION = "/usr/local/bin/dsh";
var MAC_CLI_RECEIPT = "/usr/local/bin/.dsh-custom-env-command.json";
var MacosCommandError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MacosCommandError";
  }
  code;
};
function readMacosCliLink(destination = MAC_CLI_DESTINATION) {
  try {
    if (!lstatSync2(destination).isSymbolicLink()) return void 0;
    const target = readlinkSync2(destination);
    return isAbsolute3(target) ? target : join3(dirname2(destination), target);
  } catch {
    return void 0;
  }
}
async function installMacosCliLink(launcher) {
  if (process.platform !== "darwin") {
    throw new MacosCommandError("EUNSUPPORTED", "macOS command install is only available on darwin.");
  }
  if (!isAbsolute3(launcher) || !existsSync3(launcher)) {
    throw new MacosCommandError("ENOENT", "The expected launcher is unavailable.");
  }
  const current = readMacosCliLink();
  if (current !== void 0 && same(current, launcher)) {
    writeReceipt(launcher);
    return;
  }
  try {
    await writeLink(launcher);
  } catch (error) {
    if (error.code !== "EACCES") throw error;
    await writeLinkElevated(launcher);
  }
  writeReceipt(launcher);
}
async function writeLink(launcher) {
  mkdirSync(dirname2(MAC_CLI_DESTINATION), { recursive: true });
  const pending = `${MAC_CLI_DESTINATION}.dsh-custom-env-new`;
  try {
    unlinkSync(pending);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  symlinkSync(launcher, pending);
  try {
    try {
      unlinkSync(MAC_CLI_DESTINATION);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    renameSync(pending, MAC_CLI_DESTINATION);
  } catch (error) {
    try {
      unlinkSync(pending);
    } catch (cleanup) {
      if (cleanup.code !== "ENOENT") {
        throw new AggregateError([error, cleanup], "Failed to install macOS dsh link");
      }
    }
    throw error;
  }
}
async function writeLinkElevated(launcher) {
  const escapedLauncher = launcher.replace(/'/gu, `'\\''`);
  const escapedDest = MAC_CLI_DESTINATION.replace(/'/gu, `'\\''`);
  const shell = `mkdir -p /usr/local/bin && ln -sfn '${escapedLauncher}' '${escapedDest}'`;
  const script = `do shell script ${JSON.stringify(shell)} with administrator privileges`;
  try {
    await execFileAsync("/usr/bin/osascript", ["-e", script]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new MacosCommandError("EACCES", `Elevated symlink failed: ${message}`);
  }
}
function writeReceipt(launcher) {
  const receipt = { schemaVersion: 1, launcher };
  try {
    writeFileSync(MAC_CLI_RECEIPT, `${JSON.stringify(receipt)}
`, { mode: 420 });
  } catch (error) {
    if (error.code !== "EACCES") {
      try {
        const existing = readFileSync(MAC_CLI_RECEIPT, "utf8");
        if (existing.includes(launcher)) return;
      } catch {
      }
    }
  }
}
function same(left, right) {
  return left === right;
}

// src/cli-path/resolve-expected.ts
import { existsSync as existsSync4 } from "node:fs";
import { basename as basename2, dirname as dirname3, join as join4, resolve as resolve2 } from "node:path";
function basenameLower(path) {
  return basename2(path).toLowerCase();
}
function resolveExpectedCli(options = {}) {
  const platform = options.platform ?? process.platform;
  const execPath = options.execPath ?? process.execPath;
  const argv = options.argv ?? process.argv;
  const electron = options.electronRunAsNode ?? process.env.ELECTRON_RUN_AS_NODE;
  const exists = options.exists ?? existsSync4;
  const name = launcherName(platform);
  if (electron !== void 0 && electron !== "") {
    const resources = findElectronResources(execPath, platform, exists);
    if (resources !== void 0) {
      const directory = join4(resources, "runtime", "cli", "bin");
      const launcher = join4(directory, name);
      if (exists(launcher)) return { launcher: resolve2(launcher), directory: resolve2(directory), kind: "electron-resources" };
    }
  }
  const argv1 = argv[1];
  if (looksLikeCliEntry(argv1) && argv1 !== void 0) {
    const file = resolve2(argv1);
    if (exists(file)) {
      const base = basenameLower(file);
      if (base === name.toLowerCase() || base === "dsh" || base === "dsh.cmd") {
        return { launcher: file, directory: dirname3(file), kind: "argv" };
      }
      const directory = findLauncherDirectory(file, platform, 8, exists);
      if (directory !== void 0) {
        const launcher = join4(directory, name);
        if (exists(launcher)) return { launcher: resolve2(launcher), directory: resolve2(directory), kind: "argv" };
      }
      const siblingBin = join4(dirname3(file), "bin", name);
      if (exists(siblingBin)) {
        return { launcher: resolve2(siblingBin), directory: resolve2(dirname3(siblingBin)), kind: "argv" };
      }
    }
  }
  if (argv1 !== void 0 && argv1 !== "") {
    const walked = findLauncherDirectory(resolve2(argv1), platform, 8, exists);
    if (walked !== void 0) {
      const launcher = join4(walked, name);
      if (exists(launcher)) return { launcher: resolve2(launcher), directory: resolve2(walked), kind: "walk" };
    }
  }
  return void 0;
}

// src/cli-path/status.ts
function buildCliStatus(options = {}) {
  const platform = options.platform ?? process.platform;
  const expected = options.expected !== void 0 ? options.expected : resolveExpectedCli({ platform });
  const active = options.active ?? inspectActiveCli({ platform });
  if (expected === void 0) {
    return {
      platform,
      activePath: active.path ?? null,
      expectedPath: null,
      expectedDirectory: null,
      matches: false,
      canInstall: false,
      reason: options.resolveFailedReason ?? "could-not-resolve-expected-cli"
    };
  }
  const matches = activeMatchesExpected(active, expected.launcher, platform);
  const canInstall = !matches && (platform === "win32" || platform === "darwin");
  return {
    platform,
    activePath: active.path ?? null,
    expectedPath: expected.launcher,
    expectedDirectory: expected.directory,
    matches,
    canInstall,
    reason: matches ? null : platform !== "win32" && platform !== "darwin" ? "unsupported-platform" : null
  };
}

// src/cli-path/windows.ts
import { spawn } from "node:child_process";
import { existsSync as existsSync5 } from "node:fs";
import { dirname as dirname4, join as join5 } from "node:path";
import { fileURLToPath } from "node:url";
var WindowsCommandError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "WindowsCommandError";
  }
  code;
};
function commandPathScript(fromUrl = import.meta.url) {
  const here = dirname4(fileURLToPath(fromUrl));
  const candidates = [
    join5(here, "..", "scripts", "command-path.ps1"),
    join5(here, "..", "..", "scripts", "command-path.ps1"),
    join5(here, "scripts", "command-path.ps1")
  ];
  for (const candidate of candidates) {
    if (existsSync5(candidate)) return candidate;
  }
  return candidates[0];
}
async function runWindowsCommandPath(operation, directory, expected) {
  if (process.platform !== "win32") {
    throw new WindowsCommandError("EUNSUPPORTED", "Windows command PATH install is only available on win32.");
  }
  const systemRoot = process.env.SystemRoot ?? process.env.WINDIR;
  if (systemRoot === void 0) {
    throw new WindowsCommandError("ENOENT", "Windows system directory is unavailable.");
  }
  const shell = join5(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const script = commandPathScript();
  const child = spawn(
    shell,
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script],
    { stdio: ["pipe", "pipe", "pipe"], windowsHide: true }
  );
  const chunks = [];
  const errChunks = [];
  child.stdout.on("data", (chunk) => {
    chunks.push(chunk);
  });
  child.stderr.on("data", (chunk) => {
    errChunks.push(chunk);
  });
  const exited = new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("close", accept);
  });
  child.stdin.end(JSON.stringify({
    operation,
    directory,
    ...expected === void 0 ? {} : { expected }
  }));
  const code = await exited;
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const detail = Buffer.concat(errChunks).toString("utf8").trim() || raw;
    throw new WindowsCommandError(
      "EIO",
      `command-path.ps1 returned invalid JSON (exit ${String(code)})${detail === "" ? "" : `: ${detail}`}`
    );
  }
  if (parsed.ok !== true || parsed.state === void 0) {
    throw new WindowsCommandError(
      typeof parsed.code === "string" ? parsed.code : "EIO",
      typeof parsed.message === "string" ? parsed.message : "command-path.ps1 failed"
    );
  }
  const state = parsed.state;
  if (typeof state.fingerprint !== "string" || typeof state.directory !== "string" || typeof state.available !== "boolean" || typeof state.managed !== "boolean") {
    throw new WindowsCommandError("EIO", "command-path.ps1 returned an incomplete state.");
  }
  return {
    fingerprint: state.fingerprint,
    directory: state.directory,
    available: state.available,
    managed: state.managed,
    ...typeof state.activeCommand === "string" ? { activeCommand: state.activeCommand } : {}
  };
}

// src/cli-path/index.ts
async function cliStatus() {
  const platform = process.platform;
  const expected = resolveExpectedCli({ platform });
  if (platform === "win32" && expected !== void 0) {
    try {
      const state = await runWindowsCommandPath("inspect", expected.directory);
      return buildCliStatus({
        platform,
        expected,
        active: { path: state.activeCommand, symlinkTarget: void 0 }
      });
    } catch {
    }
  }
  if (platform === "darwin" && expected !== void 0) {
    const link = readMacosCliLink();
    const active = inspectActiveCli({ platform });
    const path = active.path ?? (link !== void 0 ? "/usr/local/bin/dsh" : void 0);
    return buildCliStatus({
      platform,
      expected,
      active: {
        path,
        symlinkTarget: link ?? active.symlinkTarget
      }
    });
  }
  return buildCliStatus({ platform, expected });
}
async function cliInstall() {
  const before = await cliStatus();
  if (!before.canInstall || before.expectedPath === null || before.expectedDirectory === null) {
    const error = new Error(before.reason ?? "CLI install is not available");
    error.code = "EUNSUPPORTED";
    throw error;
  }
  const platform = before.platform;
  try {
    if (platform === "win32") {
      const inspect = await runWindowsCommandPath("inspect", before.expectedDirectory);
      await runWindowsCommandPath("install", before.expectedDirectory, inspect.fingerprint);
    } else if (platform === "darwin") {
      await installMacosCliLink(before.expectedPath);
    } else {
      throw new Error("CLI install is not supported on this platform");
    }
  } catch (error) {
    if (error instanceof WindowsCommandError || error instanceof MacosCommandError) throw error;
    throw error;
  }
  return cliStatus();
}

// src/env-file.ts
import { existsSync as existsSync6, mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { dirname as dirname5, join as join6 } from "node:path";
import { parseEnv } from "node:util";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";

// src/names.ts
var BOOTSTRAP_NAMES = /* @__PURE__ */ new Set([
  "PATH",
  "HOME",
  "USERPROFILE",
  "SHELL",
  "NODE_OPTIONS",
  "NODE_PATH",
  "NODE_EXTRA_CA_CERTS",
  "LD_PRELOAD",
  "LD_LIBRARY_PATH",
  "LD_AUDIT",
  "BASH_ENV",
  "ENV",
  "SHELLOPTS",
  "BASHOPTS",
  "PERL5OPT",
  "PERL5LIB",
  "PYTHONSTARTUP",
  "PYTHONPATH",
  "RUBYOPT",
  "RUBYLIB",
  "JAVA_TOOL_OPTIONS",
  "_JAVA_OPTIONS",
  "JDK_JAVA_OPTIONS",
  "PYTHONHOME",
  "GIT_SSH",
  "GIT_SSH_COMMAND",
  "GIT_EXTERNAL_DIFF",
  "GIT_PAGER",
  "GIT_EDITOR",
  "GIT_ASKPASS",
  "SSH_ASKPASS",
  "GIT_CONFIG_GLOBAL",
  "GIT_CONFIG_SYSTEM",
  "GIT_CONFIG_COUNT",
  "EDITOR",
  "VISUAL",
  "PAGER",
  "BROWSER",
  "DEEPSEEK_BASE_URL",
  "DEEPSEEK_SEARCH_BASE_URL",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "REQUESTS_CA_BUNDLE",
  "CURL_CA_BUNDLE",
  "NODE_TLS_REJECT_UNAUTHORIZED"
]);
var BOOTSTRAP_PREFIXES = ["DSH_", "XDG_", "DYLD_", "BASH_FUNC_"];
var ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function isBootstrapOnly(name) {
  const upper = name.toUpperCase();
  return BOOTSTRAP_NAMES.has(upper) || BOOTSTRAP_PREFIXES.some((prefix) => upper.startsWith(prefix));
}
function isWritableEnvName(name) {
  return ENV_NAME.test(name) && !isBootstrapOnly(name);
}

// src/env-file.ts
function envFilePath() {
  return join6(resolveDshHome(), ".env");
}
function loadEnvMap() {
  const path = envFilePath();
  if (!existsSync6(path)) return {};
  const raw = readFileSync2(path, "utf8").replace(/^\uFEFF/u, "").trim();
  if (raw === "") return {};
  let parsed;
  try {
    parsed = parseEnv(raw);
  } catch (error) {
    throw new Error(`custom-env: invalid dotenv syntax in ${path}`, { cause: error });
  }
  const out = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string" && value !== "" && isWritableEnvName(key)) out[key] = value;
  }
  return out;
}
function listEnvEntries() {
  const path = envFilePath();
  const exists = existsSync6(path);
  const map = loadEnvMap();
  const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({ name, value }));
  return { path, exists, entries };
}
function encodeValue(value) {
  if (/^[A-Za-z0-9_./:@+-]*$/u.test(value)) return value;
  return `"${value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"').replace(/\n/gu, "\\n")}"`;
}
function parseLines(content) {
  const text = content.replace(/^\uFEFF/u, "");
  if (text === "") return [];
  return text.split(/\r?\n/u).map((raw) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return { kind: "other", raw };
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(trimmed);
    if (match?.[1] === void 0) return { kind: "other", raw };
    return { kind: "assignment", raw, name: match[1] };
  });
}
function serializeLines(lines) {
  if (lines.length === 0) return "";
  return `${lines.map((line) => line.raw).join("\n")}
`;
}
function writeEnvFile(content) {
  const path = envFilePath();
  mkdirSync2(dirname5(path), { recursive: true });
  writeFileSync2(path, content, "utf8");
}
function upsertEnvEntry(name, value) {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`);
  }
  if (value === "") {
    throw new Error(`custom-env: empty value for "${name}"`);
  }
  const path = envFilePath();
  const existing = existsSync6(path) ? readFileSync2(path, "utf8") : "";
  const lines = parseLines(existing);
  const assignment = `${name}=${encodeValue(value)}`;
  let replaced = false;
  const next = lines.map((line) => {
    if (line.kind === "assignment" && line.name === name) {
      replaced = true;
      return { kind: "assignment", raw: assignment, name };
    }
    return line;
  });
  if (!replaced) next.push({ kind: "assignment", raw: assignment, name });
  writeEnvFile(serializeLines(next));
}
function removeEnvEntry(name) {
  if (!isWritableEnvName(name)) {
    throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`);
  }
  const path = envFilePath();
  if (!existsSync6(path)) return false;
  const lines = parseLines(readFileSync2(path, "utf8"));
  const next = lines.filter((line) => !(line.kind === "assignment" && line.name === name));
  if (next.length === lines.length) return false;
  writeEnvFile(serializeLines(next));
  return true;
}

// src/os-user-env/macos.ts
import { mkdirSync as mkdirSync3, writeFileSync as writeFileSync3, unlinkSync as unlinkSync2, existsSync as existsSync7 } from "node:fs";
import { homedir } from "node:os";
import { join as join7 } from "node:path";
import { spawnSync } from "node:child_process";
var AGENT_LABEL = "ai.dsh.custom-env";
var AGENT_DIR = () => join7(homedir(), "Library", "LaunchAgents");
var AGENT_PATH = () => join7(AGENT_DIR(), `${AGENT_LABEL}.plist`);
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
    if (existsSync7(path)) {
      try {
        launchctl(["unload", path]);
      } catch (_error) {
      }
      unlinkSync2(path);
    }
    return;
  }
  mkdirSync3(AGENT_DIR(), { recursive: true });
  writeFileSync3(path, buildPlist(entries), "utf8");
  try {
    launchctl(["unload", path]);
  } catch (_error) {
  }
  launchctl(["load", path]);
}
function persistMacosUserEnv(entries, platform = process.platform) {
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
function removeMacosUserEnv(name, platform = process.platform) {
  if (platform !== "darwin") return;
  const map = ensureCache();
  delete map[name];
  try {
    launchctl(["unsetenv", name]);
  } catch (_error) {
  }
  writeAgent(map);
}

// src/os-user-env/windows.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { join as join8 } from "node:path";
function runPowerShell(script) {
  const systemRoot = process.env.SystemRoot ?? process.env.WINDIR ?? "C:\\Windows";
  const shell = join8(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const result = spawnSync2(
    shell,
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    { encoding: "utf8", windowsHide: true }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`custom-env: PowerShell failed${detail === "" ? "" : `: ${detail}`}`);
  }
}
function psQuote(value) {
  return `'${value.replace(/'/gu, "''")}'`;
}
function persistWindowsUserEnv(entries, platform = process.platform) {
  if (platform !== "win32") return;
  const pairs = Object.entries(entries);
  if (pairs.length === 0) return;
  const script = pairs.map(([name, value]) => `[Environment]::SetEnvironmentVariable(${psQuote(name)}, ${psQuote(value)}, 'User')`).join("; ");
  runPowerShell(script);
}
function removeWindowsUserEnv(name, platform = process.platform) {
  if (platform !== "win32") return;
  runPowerShell(`[Environment]::SetEnvironmentVariable(${psQuote(name)}, $null, 'User')`);
}

// src/os-user-env/index.ts
function persistUserEnv(entries) {
  persistWindowsUserEnv(entries);
  persistMacosUserEnv(entries);
}
function removeUserEnv(name) {
  removeWindowsUserEnv(name);
  removeMacosUserEnv(name);
}

// src/pending.ts
function classifyEntry(name, value, baseline) {
  if (!(name in baseline)) {
    return { kind: "added", previous: null };
  }
  const previous = baseline[name];
  if (previous === value) {
    return { kind: "unchanged", previous: null };
  }
  return { kind: "modified", previous };
}

// src/index.ts
function applyLive(entries) {
  for (const [key, value] of Object.entries(entries)) {
    process.env[key] = value;
  }
  try {
    persistUserEnv(entries);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    process.stderr.write(`custom-env: failed to persist OS user environment: ${detail}
`);
  }
}
function clearLive(name) {
  delete process.env[name];
  try {
    removeUserEnv(name);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    process.stderr.write(`custom-env: failed to remove OS user environment ${name}: ${detail}
`);
  }
}
var _cliInstall_dec, _cliStatus_dec, _restore_dec, _remove_dec, _upsert_dec, _list_dec, _a, _init;
var CustomEnvController = class extends (_a = TypertRemoteService, _list_dec = [Remote("list")], _upsert_dec = [Remote("upsert")], _remove_dec = [Remote("remove")], _restore_dec = [Remote("restore")], _cliStatus_dec = [Remote("cliStatus")], _cliInstall_dec = [Remote("cliInstall")], _a) {
  constructor(ctx) {
    super(ctx, "customEnv");
    __runInitializers(_init, 5, this);
    /** `.env` map captured when this Host plugin started. */
    __publicField(this, "baseline");
    const loaded = loadEnvMap();
    this.baseline = { ...loaded };
    applyLive(loaded);
  }
  async list() {
    const { path, exists, entries: raw } = listEnvEntries();
    const entries = raw.map(({ name, value }) => {
      const classified = classifyEntry(name, value, this.baseline);
      return { name, value, kind: classified.kind, previous: classified.previous };
    });
    return { path, exists, entries };
  }
  async upsert(name, value) {
    if (!isWritableEnvName(name)) {
      throw new RemoteError("custom-env/invalid-name", `refused name "${name}"`, { name });
    }
    if (value === "") {
      throw new RemoteError("custom-env/invalid-value", `empty value for "${name}"`, { name });
    }
    try {
      upsertEnvEntry(name, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RemoteError("custom-env/invalid-name", message, { name }, { cause: error });
    }
    applyLive({ [name]: value });
    return this.list();
  }
  async remove(name) {
    if (!isWritableEnvName(name)) {
      throw new RemoteError("custom-env/invalid-name", `refused name "${name}"`, { name });
    }
    try {
      removeEnvEntry(name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RemoteError("custom-env/invalid-name", message, { name }, { cause: error });
    }
    clearLive(name);
    return this.list();
  }
  async restore(name) {
    if (!isWritableEnvName(name)) {
      throw new RemoteError("custom-env/invalid-name", `refused name "${name}"`, { name });
    }
    const previous = this.baseline[name];
    if (previous === void 0) {
      throw new RemoteError("custom-env/restore-failed", `no baseline for "${name}"`, { name });
    }
    const current = loadEnvMap()[name];
    if (current === previous) {
      return this.list();
    }
    try {
      upsertEnvEntry(name, previous);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new RemoteError("custom-env/restore-failed", message, { name }, { cause: error });
    }
    applyLive({ [name]: previous });
    return this.list();
  }
  async cliStatus() {
    return cliStatus();
  }
  async cliInstall() {
    try {
      return await cliInstall();
    } catch (error) {
      const code = typeof error.code === "string" ? error.code : "EIO";
      const message = error instanceof Error ? error.message : String(error);
      throw new RemoteError("custom-env/cli-install-failed", message, { code }, { cause: error });
    }
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "list", _list_dec, CustomEnvController);
__decorateElement(_init, 1, "upsert", _upsert_dec, CustomEnvController);
__decorateElement(_init, 1, "remove", _remove_dec, CustomEnvController);
__decorateElement(_init, 1, "restore", _restore_dec, CustomEnvController);
__decorateElement(_init, 1, "cliStatus", _cliStatus_dec, CustomEnvController);
__decorateElement(_init, 1, "cliInstall", _cliInstall_dec, CustomEnvController);
__decoratorMetadata(_init, CustomEnvController);
export {
  classifyEntry,
  CustomEnvController as default,
  envFilePath
};
