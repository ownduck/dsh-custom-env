import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseEnv } from "node:util";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
//#region lib/types/names.js
/**
* Names and prefixes that must not be written through `$DSH_HOME/.env`
* (mirrors app-boot bootstrap rejection).
*/
/** Exact names no discovered `.env` file may set. */
const BOOTSTRAP_NAMES = new Set([
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
/** Name prefixes no discovered `.env` file may set. */
const BOOTSTRAP_PREFIXES = [
	"DSH_",
	"XDG_",
	"DYLD_",
	"BASH_FUNC_"
];
/** Valid dotenv key characters (POSIX-ish). */
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u;
/**
* Whether a variable may come only from the inherited process environment.
* @param name - candidate variable name.
* @returns true when `.env` must not set this name.
*/
function isBootstrapOnly(name) {
	const upper = name.toUpperCase();
	return BOOTSTRAP_NAMES.has(upper) || BOOTSTRAP_PREFIXES.some((prefix) => upper.startsWith(prefix));
}
/**
* Whether `name` is a writable non-bootstrap environment key.
* @param name - candidate variable name.
* @returns true when the key may be stored in `$DSH_HOME/.env`.
*/
function isWritableEnvName(name) {
	return ENV_NAME.test(name) && !isBootstrapOnly(name);
}
//#endregion
//#region lib/types/env-file.js
/** Line-oriented `$DSH_HOME/.env` read/write helpers. */
/**
* Absolute path of the harness-home dotenv file.
* @returns `$DSH_HOME/.env`.
*/
function envFilePath() {
	return join(resolveDshHome(), ".env");
}
/**
* Read non-empty string entries from `$DSH_HOME/.env`.
* @returns Variable map, or `{}` when absent / empty.
*/
function loadEnvMap() {
	const path = envFilePath();
	if (!existsSync(path)) return {};
	const raw = readFileSync(path, "utf8").replace(/^\uFEFF/u, "").trim();
	if (raw === "") return {};
	let parsed;
	try {
		parsed = parseEnv(raw);
	} catch (error) {
		throw new Error(`custom-env: invalid dotenv syntax in ${path}`, { cause: error });
	}
	const out = {};
	for (const [key, value] of Object.entries(parsed)) if (typeof value === "string" && value !== "" && isWritableEnvName(key)) out[key] = value;
	return out;
}
/**
* List writable entries for the settings UI.
* @returns Path, existence, and ordered entries.
*/
function listEnvEntries() {
	const path = envFilePath();
	const exists = existsSync(path);
	const map = loadEnvMap();
	return {
		path,
		exists,
		entries: Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ({
			name,
			value
		}))
	};
}
/**
* Escape a dotenv value when it needs quotes.
* @param value - raw value.
* @returns dotenv-encoded value token.
*/
function encodeValue(value) {
	if (/^[A-Za-z0-9_./:@+-]*$/u.test(value)) return value;
	return `"${value.replace(/\\/gu, "\\\\").replace(/"/gu, "\\\"").replace(/\n/gu, "\\n")}"`;
}
/**
* Parse the physical file into assignment and passthrough lines.
* @param content - file text.
* @returns line records.
*/
function parseLines(content) {
	const text = content.replace(/^\uFEFF/u, "");
	if (text === "") return [];
	return text.split(/\r?\n/u).map((raw) => {
		const trimmed = raw.trim();
		if (trimmed === "" || trimmed.startsWith("#")) return {
			kind: "other",
			raw
		};
		const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/u.exec(trimmed);
		if (match?.[1] === void 0) return {
			kind: "other",
			raw
		};
		return {
			kind: "assignment",
			raw,
			name: match[1]
		};
	});
}
/**
* Serialize lines back to disk text (POSIX newlines, trailing newline).
* @param lines - line records.
* @returns file body.
*/
function serializeLines(lines) {
	if (lines.length === 0) return "";
	return `${lines.map((line) => line.raw).join("\n")}\n`;
}
/**
* Ensure the parent of `$DSH_HOME/.env` exists, then write `content`.
* @param content - full file body.
*/
function writeEnvFile(content) {
	const path = envFilePath();
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content, "utf8");
}
/**
* Upsert one key in `$DSH_HOME/.env`, creating the file when missing.
* @param name - variable name (must be writable).
* @param value - non-empty value.
*/
function upsertEnvEntry(name, value) {
	if (!isWritableEnvName(name)) throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`);
	if (value === "") throw new Error(`custom-env: empty value for "${name}"`);
	const path = envFilePath();
	const lines = parseLines(existsSync(path) ? readFileSync(path, "utf8") : "");
	const assignment = `${name}=${encodeValue(value)}`;
	let replaced = false;
	const next = lines.map((line) => {
		if (line.kind === "assignment" && line.name === name) {
			replaced = true;
			return {
				kind: "assignment",
				raw: assignment,
				name
			};
		}
		return line;
	});
	if (!replaced) next.push({
		kind: "assignment",
		raw: assignment,
		name
	});
	writeEnvFile(serializeLines(next));
}
/**
* Remove one key from `$DSH_HOME/.env` when present.
* @param name - variable name.
* @returns true when a line was removed.
*/
function removeEnvEntry(name) {
	if (!isWritableEnvName(name)) throw new Error(`custom-env: refused bootstrap or invalid name "${name}"`);
	const path = envFilePath();
	if (!existsSync(path)) return false;
	const lines = parseLines(readFileSync(path, "utf8"));
	const next = lines.filter((line) => !(line.kind === "assignment" && line.name === name));
	if (next.length === lines.length) return false;
	writeEnvFile(serializeLines(next));
	return true;
}
//#endregion
//#region lib/types/os-user-env/macos.js
/**
* Persist user environment variables on macOS via launchctl and a Login LaunchAgent.
*/
const AGENT_LABEL = "ai.dsh.custom-env";
const AGENT_DIR = () => join(homedir(), "Library", "LaunchAgents");
const AGENT_PATH = () => join(AGENT_DIR(), `${AGENT_LABEL}.plist`);
/** In-memory agent map for this process; reloaded from disk on first mutate. */
let cached;
/**
* Escape a string for embedding in a LaunchAgent plist.
* @param value - raw text.
* @returns XML-safe text.
*/
function escapeXml(value) {
	return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;").replace(/"/gu, "&quot;");
}
/**
* Build a LaunchAgent plist that exports `entries` at login.
* @param entries - environment map.
* @returns plist XML.
*/
function buildPlist(entries) {
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
${Object.entries(entries).map(([key, value]) => `    <key>${escapeXml(key)}</key>\n    <string>${escapeXml(value)}</string>`).join("\n")}
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
			} catch (_error) {}
			unlinkSync(path);
		}
		return;
	}
	mkdirSync(AGENT_DIR(), { recursive: true });
	writeFileSync(path, buildPlist(entries), "utf8");
	try {
		launchctl(["unload", path]);
	} catch (_error) {}
	launchctl(["load", path]);
}
/**
* Set user-domain environment variables for new GUI sessions and refresh the Login Agent.
* @param entries - Variable map to persist.
* @param platform - Override for tests; defaults to `process.platform`.
*/
function persistMacosUserEnv(entries, platform = process.platform) {
	if (platform !== "darwin") return;
	const pairs = Object.entries(entries);
	if (pairs.length === 0) return;
	const map = ensureCache();
	for (const [name, value] of pairs) {
		map[name] = value;
		launchctl([
			"setenv",
			name,
			value
		]);
	}
	writeAgent(map);
}
/**
* Unset one user-domain environment variable and refresh the Login Agent.
* @param name - Variable name to remove.
* @param platform - Override for tests; defaults to `process.platform`.
*/
function removeMacosUserEnv(name, platform = process.platform) {
	if (platform !== "darwin") return;
	const map = ensureCache();
	delete map[name];
	try {
		launchctl(["unsetenv", name]);
	} catch (_error) {}
	writeAgent(map);
}
//#endregion
//#region lib/types/os-user-env/windows.js
/**
* Persist or delete variables in the Windows user environment (HKCU\\Environment)
* via PowerShell — no native addon required for profile installs.
*/
/**
* Run a PowerShell snippet and throw on non-zero exit.
* @param script - PowerShell source.
*/
function runPowerShell(script) {
	const result = spawnSync(join(process.env.SystemRoot ?? process.env.WINDIR ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"), [
		"-NoProfile",
		"-NonInteractive",
		"-ExecutionPolicy",
		"Bypass",
		"-Command",
		script
	], {
		encoding: "utf8",
		windowsHide: true
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const detail = (result.stderr || result.stdout || "").trim();
		throw new Error(`custom-env: PowerShell failed${detail === "" ? "" : `: ${detail}`}`);
	}
}
/**
* Escape a string for a single-quoted PowerShell literal.
* @param value - raw text.
* @returns PowerShell single-quoted string.
*/
function psQuote(value) {
	return `'${value.replace(/'/gu, "''")}'`;
}
/**
* Write entries into HKCU\\Environment (broadcasts WM_SETTINGCHANGE).
* No-op on non-Windows hosts or when `entries` is empty.
* @param entries - Variable map to persist.
* @param platform - Override for tests; defaults to `process.platform`.
*/
function persistWindowsUserEnv(entries, platform = process.platform) {
	if (platform !== "win32") return;
	const pairs = Object.entries(entries);
	if (pairs.length === 0) return;
	runPowerShell(pairs.map(([name, value]) => `[Environment]::SetEnvironmentVariable(${psQuote(name)}, ${psQuote(value)}, 'User')`).join("; "));
}
/**
* Delete one user environment value from HKCU\\Environment.
* Missing values are ignored.
* @param name - Variable name to remove.
* @param platform - Override for tests; defaults to `process.platform`.
*/
function removeWindowsUserEnv(name, platform = process.platform) {
	if (platform !== "win32") return;
	runPowerShell(`[Environment]::SetEnvironmentVariable(${psQuote(name)}, $null, 'User')`);
}
//#endregion
//#region lib/types/os-user-env/index.js
/** OS user-environment sync for Windows and macOS (no-op elsewhere). */
/**
* Persist entries into the current user's OS environment when supported.
* @param entries - Variable map to write.
*/
function persistUserEnv(entries) {
	persistWindowsUserEnv(entries);
	persistMacosUserEnv(entries);
}
/**
* Remove one key from the current user's OS environment when supported.
* @param name - Variable name to delete.
*/
function removeUserEnv(name) {
	removeWindowsUserEnv(name);
	removeMacosUserEnv(name);
}
//#endregion
//#region lib/types/index.js
/**
* Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/**
* Apply a map onto `process.env` and the OS user environment.
* @param entries - values to assign.
*/
function applyLive(entries) {
	for (const [key, value] of Object.entries(entries)) process.env[key] = value;
	try {
		persistUserEnv(entries);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		process.stderr.write(`custom-env: failed to persist OS user environment: ${detail}\n`);
	}
}
/**
* Remove one key from `process.env` and the OS user environment.
* @param name - variable to clear.
*/
function clearLive(name) {
	delete process.env[name];
	try {
		removeUserEnv(name);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		process.stderr.write(`custom-env: failed to remove OS user environment ${name}: ${detail}\n`);
	}
}
let CustomEnvController = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _list_decorators;
	let _upsert_decorators;
	let _remove_decorators;
	return class CustomEnvController extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_list_decorators = [Remote("list")];
			_upsert_decorators = [Remote("upsert")];
			_remove_decorators = [Remote("remove")];
			__esDecorate(this, null, _list_decorators, {
				kind: "method",
				name: "list",
				static: false,
				private: false,
				access: {
					has: (obj) => "list" in obj,
					get: (obj) => obj.list
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _upsert_decorators, {
				kind: "method",
				name: "upsert",
				static: false,
				private: false,
				access: {
					has: (obj) => "upsert" in obj,
					get: (obj) => obj.upsert
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _remove_decorators, {
				kind: "method",
				name: "remove",
				static: false,
				private: false,
				access: {
					has: (obj) => "remove" in obj,
					get: (obj) => obj.remove
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		constructor(ctx) {
			super(ctx, "customEnv");
			__runInitializers(this, _instanceExtraInitializers);
			applyLive(loadEnvMap());
		}
		/**
		* List current `$DSH_HOME/.env` entries.
		* @returns path, existence, and sorted entries.
		*/
		async list() {
			const { path, exists, entries } = listEnvEntries();
			return {
				path,
				exists,
				entries
			};
		}
		/**
		* Create or replace one entry, syncing Host and OS user environment.
		* @param name - writable variable name.
		* @param value - non-empty value.
		* @returns updated snapshot.
		*/
		async upsert(name, value) {
			if (!isWritableEnvName(name)) throw new RemoteError("custom-env/invalid-name", `refused name "${name}"`, { name });
			if (value === "") throw new RemoteError("custom-env/invalid-value", `empty value for "${name}"`, { name });
			try {
				upsertEnvEntry(name, value);
			} catch (error) {
				throw new RemoteError("custom-env/invalid-name", error instanceof Error ? error.message : String(error), { name }, { cause: error });
			}
			applyLive({ [name]: value });
			return this.list();
		}
		/**
		* Delete one entry from the file, Host, and OS user environment.
		* @param name - writable variable name.
		* @returns updated snapshot.
		*/
		async remove(name) {
			if (!isWritableEnvName(name)) throw new RemoteError("custom-env/invalid-name", `refused name "${name}"`, { name });
			try {
				removeEnvEntry(name);
			} catch (error) {
				throw new RemoteError("custom-env/invalid-name", error instanceof Error ? error.message : String(error), { name }, { cause: error });
			}
			clearLive(name);
			return this.list();
		}
	};
})();
//#endregion
export { CustomEnvController as default, envFilePath };
