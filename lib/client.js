window.__ModuleLoader__.load({ id: "dsh-custom-env", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// lib/typert.remote-client.js
var import_zod = require("zod");
var import_remote_info = require("@deepseek-ai/dsh-typert-protocol/remote-info");
var list$result$schema$value;
var list$result$schema = () => list$result$schema$value ??= import_zod.z.object({
  path: import_zod.z.string().readonly(),
  exists: import_zod.z.boolean().readonly(),
  entries: import_zod.z.array(import_zod.z.object({
    name: import_zod.z.string().readonly(),
    value: import_zod.z.string().readonly()
  }).readonly()).readonly()
});
var cliStatus$result$schema$value;
var cliStatus$result$schema = () => cliStatus$result$schema$value ??= import_zod.z.object({
  platform: import_zod.z.string().readonly(),
  activePath: import_zod.z.string().nullable().readonly(),
  expectedPath: import_zod.z.string().nullable().readonly(),
  expectedDirectory: import_zod.z.string().nullable().readonly(),
  matches: import_zod.z.boolean().readonly(),
  canInstall: import_zod.z.boolean().readonly(),
  reason: import_zod.z.string().nullable().readonly()
});
var upsert$parameter$0$schema$value;
var upsert$parameter$0$schema = () => upsert$parameter$0$schema$value ??= import_zod.z.string();
var upsert$parameter$1$schema$value;
var upsert$parameter$1$schema = () => upsert$parameter$1$schema$value ??= import_zod.z.string();
var remove$parameter$0$schema$value;
var remove$parameter$0$schema = () => remove$parameter$0$schema$value ??= import_zod.z.string();
var cliStatusJsonSchema = {
  type: "object",
  properties: {
    platform: { type: "string" },
    activePath: { type: ["string", "null"] },
    expectedPath: { type: ["string", "null"] },
    expectedDirectory: { type: ["string", "null"] },
    matches: { type: "boolean" },
    canInstall: { type: "boolean" },
    reason: { type: ["string", "null"] }
  },
  required: ["platform", "activePath", "expectedPath", "expectedDirectory", "matches", "canInstall", "reason"],
  additionalProperties: true
};
var envSnapshotJsonSchema = {
  type: "object",
  properties: {
    path: { type: "string" },
    exists: { type: "boolean" },
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, value: { type: "string" } },
        required: ["name", "value"],
        additionalProperties: true
      }
    }
  },
  required: ["path", "exists", "entries"],
  additionalProperties: true
};
var TYPERT_REMOTE = (0, import_remote_info.createTypertRemoteInfo)({
  package: "dsh-custom-env",
  methods: {
    "customEnv/list": {
      service: "customEnv",
      description: "List current $DSH_HOME/.env entries.",
      invocation: { kind: "direct" },
      parameters: [],
      result: {
        mode: "strict",
        typeSymbol: "dsh-custom-env/types#EnvSnapshot",
        create: list$result$schema,
        description: "path, existence, and sorted entries.",
        jsonSchema: envSnapshotJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/upsert": {
      service: "customEnv",
      description: "Create or replace one entry, syncing Host and OS user environment.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "name",
          description: "writable variable name.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: upsert$parameter$0$schema,
            jsonSchema: { type: "string" }
          }
        },
        {
          name: "value",
          description: "non-empty value.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: upsert$parameter$1$schema,
            jsonSchema: { type: "string" }
          }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "dsh-custom-env/types#EnvSnapshot",
        create: list$result$schema,
        description: "updated snapshot.",
        jsonSchema: envSnapshotJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/remove": {
      service: "customEnv",
      description: "Delete one entry from the file, Host, and OS user environment.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "name",
          description: "writable variable name.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: remove$parameter$0$schema,
            jsonSchema: { type: "string" }
          }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "dsh-custom-env/types#EnvSnapshot",
        create: list$result$schema,
        description: "updated snapshot.",
        jsonSchema: envSnapshotJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/cliStatus": {
      service: "customEnv",
      description: "Compare the user-environment dsh with the launcher expected for this Host.",
      invocation: { kind: "direct" },
      parameters: [],
      result: {
        mode: "strict",
        typeSymbol: "dsh-custom-env/types#CliStatus",
        create: cliStatus$result$schema,
        description: "active path, expected path, and whether Install should be offered.",
        jsonSchema: cliStatusJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/cliInstall": {
      service: "customEnv",
      description: "Install the expected CLI onto the Windows user PATH or as /usr/local/bin/dsh on macOS.",
      invocation: { kind: "direct" },
      parameters: [],
      result: {
        mode: "strict",
        typeSymbol: "dsh-custom-env/types#CliStatus",
        create: cliStatus$result$schema,
        description: "refreshed status after install.",
        jsonSchema: cliStatusJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    }
  }
}, import_zod.z);
var typert_remote_client_default = TYPERT_REMOTE;

// src/client/EnvSettingsSection.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/EnvSettingsSection.module.css
var EnvSettingsSection_default = {
  section: "EnvSettingsSection_section",
  heading: "EnvSettingsSection_heading",
  intro: "EnvSettingsSection_intro",
  path: "EnvSettingsSection_path",
  hint: "EnvSettingsSection_hint",
  empty: "EnvSettingsSection_empty",
  status: "EnvSettingsSection_status",
  cli: "EnvSettingsSection_cli",
  cliHeading: "EnvSettingsSection_cliHeading",
  cliActions: "EnvSettingsSection_cliActions",
  list: "EnvSettingsSection_list",
  row: "EnvSettingsSection_row",
  actions: "EnvSettingsSection_actions",
  add: "EnvSettingsSection_add",
  field: "EnvSettingsSection_field"
};

// src/client/EnvSettingsSection.tsx
var NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function EnvSettingsSection({ t, load, upsert, remove, cliStatus, cliInstall }) {
  const [snapshot, setSnapshot] = (0, import_react.useState)();
  const [cli, setCli] = (0, import_react.useState)();
  const [drafts, setDrafts] = (0, import_react.useState)({});
  const [newName, setNewName] = (0, import_react.useState)("");
  const [newValue, setNewValue] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  const [cliNotice, setCliNotice] = (0, import_react.useState)();
  const [nameError, setNameError] = (0, import_react.useState)(false);
  const refreshCli = (0, import_react.useCallback)(async () => {
    try {
      setCli(await cliStatus());
    } catch {
      setCli(void 0);
    }
  }, [cliStatus]);
  const refresh = (0, import_react.useCallback)(async () => {
    setBusy(true);
    setError(void 0);
    try {
      const next = await load();
      setSnapshot(next);
      const nextDrafts = {};
      for (const entry of next.entries) nextDrafts[entry.name] = entry.value;
      setDrafts(nextDrafts);
      await refreshCli();
    } catch (_error) {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }, [load, refreshCli, t]);
  (0, import_react.useEffect)(() => {
    void refresh();
  }, [refresh]);
  const run = async (action) => {
    setBusy(true);
    setError(void 0);
    try {
      const next = await action();
      setSnapshot(next);
      const nextDrafts = {};
      for (const entry of next.entries) nextDrafts[entry.name] = entry.value;
      setDrafts(nextDrafts);
    } catch (_error) {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  };
  const onAdd = () => {
    const name = newName.trim();
    if (!NAME_OK.test(name)) {
      setNameError(true);
      return;
    }
    setNameError(false);
    void run(async () => {
      const next = await upsert(name, newValue);
      setNewName("");
      setNewValue("");
      return next;
    });
  };
  const onInstallCli = () => {
    setBusy(true);
    setError(void 0);
    setCliNotice(void 0);
    void (async () => {
      try {
        const next = await cliInstall();
        setCli(next);
        setCliNotice(t("cliInstallOk"));
      } catch {
        setError(t("cliInstallError"));
      } finally {
        setBusy(false);
      }
    })();
  };
  const cliReasonCopy = (status) => {
    if (status.reason === "could-not-resolve-expected-cli") return t("cliReasonUnresolved");
    if (status.reason === "unsupported-platform") return t("cliReasonUnsupported");
    return void 0;
  };
  return /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.section }, /* @__PURE__ */ React.createElement("h2", { className: EnvSettingsSection_default.heading }, t("title")), /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.intro }, t("intro")), snapshot !== void 0 && /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.path }, t("path", { path: snapshot.path })), /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, t("osSync")), /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.cli }, /* @__PURE__ */ React.createElement("h3", { className: EnvSettingsSection_default.cliHeading }, t("cliTitle")), /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, t("cliIntro")), cli === void 0 && busy ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.status }, t("loading")) : null, cli !== void 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.path }, cli.activePath === null ? t("cliActiveMissing") : t("cliActive", { path: cli.activePath })), /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.path }, cli.expectedPath === null ? t("cliExpectedMissing") : t("cliExpected", { path: cli.expectedPath })), cli.matches ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, t("cliMatches")) : null, cliReasonCopy(cli) !== void 0 ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, cliReasonCopy(cli)) : null, cli.canInstall ? /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.cliActions }, /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, t("cliInstallHint")), cli.platform === "darwin" ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.hint }, t("cliMacConflict")) : null, /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: busy, onClick: onInstallCli }, t("cliInstall"))) : null, cliNotice !== void 0 ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.status, "data-tone": "ok", role: "status" }, cliNotice) : null) : null), error !== void 0 && /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.status, "data-tone": "error", role: "status" }, error), snapshot === void 0 && busy ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.status }, t("loading")) : null, snapshot !== void 0 && snapshot.entries.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.empty }, t("empty")) : null, snapshot !== void 0 && snapshot.entries.length > 0 ? /* @__PURE__ */ React.createElement("ul", { className: EnvSettingsSection_default.list }, snapshot.entries.map((entry) => /* @__PURE__ */ React.createElement("li", { key: entry.name, className: EnvSettingsSection_default.row }, /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.field }, /* @__PURE__ */ React.createElement("label", null, t("name")), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Input, { value: entry.name, disabled: true, readOnly: true, "aria-label": t("name") })), /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.field }, /* @__PURE__ */ React.createElement("label", { htmlFor: `env-value-${entry.name}` }, t("value")), /* @__PURE__ */ React.createElement(
    import_dsh_client_ui_primitives.Input,
    {
      id: `env-value-${entry.name}`,
      value: drafts[entry.name] ?? entry.value,
      disabled: busy,
      "aria-label": t("value"),
      onChange: (event) => {
        const value = event.target.value;
        setDrafts((previous) => ({ ...previous, [entry.name]: value }));
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.actions }, /* @__PURE__ */ React.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "outline",
      disabled: busy || (drafts[entry.name] ?? entry.value) === entry.value,
      onClick: () => {
        void run(() => upsert(entry.name, drafts[entry.name] ?? entry.value));
      }
    },
    t("save")
  ), /* @__PURE__ */ React.createElement(
    import_dsh_client_ui_primitives.Button,
    {
      size: "sm",
      variant: "ghost",
      disabled: busy,
      onClick: () => {
        void run(() => remove(entry.name));
      }
    },
    t("remove")
  ))))) : null, /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.add }, /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.field }, /* @__PURE__ */ React.createElement("label", { htmlFor: "env-new-name" }, t("name")), /* @__PURE__ */ React.createElement(
    import_dsh_client_ui_primitives.Input,
    {
      id: "env-new-name",
      value: newName,
      disabled: busy,
      placeholder: t("namePlaceholder"),
      "aria-invalid": nameError || void 0,
      onChange: (event) => {
        setNewName(event.target.value);
        setNameError(false);
      }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: EnvSettingsSection_default.field }, /* @__PURE__ */ React.createElement("label", { htmlFor: "env-new-value" }, t("value")), /* @__PURE__ */ React.createElement(
    import_dsh_client_ui_primitives.Input,
    {
      id: "env-new-value",
      value: newValue,
      disabled: busy,
      placeholder: t("valuePlaceholder"),
      onChange: (event) => {
        setNewValue(event.target.value);
      }
    }
  )), /* @__PURE__ */ React.createElement(import_dsh_client_ui_primitives.Button, { variant: "primary", disabled: busy || newName.trim() === "", onClick: onAdd }, t("add"))), nameError ? /* @__PURE__ */ React.createElement("p", { className: EnvSettingsSection_default.status, "data-tone": "error", role: "status" }, t("invalidName")) : null);
}

// src/client/locales.ts
var NS = "settings.env";
var en = {
  nav: "Environment",
  title: "Environment variables",
  intro: "Values are stored in $DSH_HOME/.env, applied to this Host immediately, and synced to your OS user environment on Windows and macOS. New terminals see OS changes after they start.",
  path: "File: {path}",
  empty: "No variables yet. Add a name and value below.",
  name: "Name",
  value: "Value",
  add: "Add",
  save: "Save",
  remove: "Remove",
  namePlaceholder: "MY_VAR",
  valuePlaceholder: "value",
  loading: "Loading\u2026",
  error: "Could not update environment variables.",
  invalidName: "Use a letter or underscore first; letters, digits, and underscores after. Bootstrap names (PATH, DSH_*, \u2026) are blocked.",
  osSync: "Synced to OS user environment (Windows / macOS).",
  cliTitle: "dsh command",
  cliIntro: "Compares the `dsh` on your user PATH with the launcher that started this Host.",
  cliActive: "On PATH: {path}",
  cliActiveMissing: "On PATH: not found",
  cliExpected: "Expected for this Host: {path}",
  cliExpectedMissing: "Expected for this Host: could not resolve",
  cliMatches: "PATH already points at this Host\u2019s launcher.",
  cliInstall: "Install dsh for this Host",
  cliInstallHint: "Opens new terminals with this Host\u2019s launcher. Restart existing terminals to pick up PATH changes.",
  cliMacConflict: "On macOS this writes /usr/local/bin/dsh and may replace the Desktop \u201CManage dsh Command\u2026\u201D link.",
  cliInstallOk: "Installed. Open a new terminal to use the updated dsh.",
  cliInstallError: "Could not install the dsh command.",
  cliReasonUnresolved: "This Host\u2019s launcher path could not be inferred, so install is unavailable.",
  cliReasonUnsupported: "CLI install is supported on Windows and macOS only."
};
var zh = {
  nav: "\u73AF\u5883\u53D8\u91CF",
  title: "\u73AF\u5883\u53D8\u91CF",
  intro: "\u4FDD\u5B58\u5728 $DSH_HOME/.env\uFF0C\u7ACB\u5373\u5199\u5165\u5F53\u524D Host \u8FDB\u7A0B\uFF0C\u5E76\u5728 Windows / macOS \u540C\u6B65\u5230\u7528\u6237\u73AF\u5883\u3002\u65B0\u5F00\u7684\u7EC8\u7AEF\u624D\u80FD\u770B\u5230 OS \u4FA7\u53D8\u66F4\u3002",
  path: "\u6587\u4EF6\uFF1A{path}",
  empty: "\u8FD8\u6CA1\u6709\u53D8\u91CF\u3002\u5728\u4E0B\u65B9\u6DFB\u52A0\u540D\u79F0\u548C\u503C\u3002",
  name: "\u540D\u79F0",
  value: "\u503C",
  add: "\u6DFB\u52A0",
  save: "\u4FDD\u5B58",
  remove: "\u5220\u9664",
  namePlaceholder: "MY_VAR",
  valuePlaceholder: "\u503C",
  loading: "\u52A0\u8F7D\u4E2D\u2026",
  error: "\u65E0\u6CD5\u66F4\u65B0\u73AF\u5883\u53D8\u91CF\u3002",
  invalidName: "\u540D\u79F0\u987B\u4EE5\u5B57\u6BCD\u6216\u4E0B\u5212\u7EBF\u5F00\u5934\uFF0C\u5176\u540E\u53EF\u4E3A\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\uFF1B\u7981\u6B62 PATH\u3001DSH_* \u7B49\u542F\u52A8\u76F8\u5173\u540D\u3002",
  osSync: "\u5DF2\u540C\u6B65\u5230\u64CD\u4F5C\u7CFB\u7EDF\u7528\u6237\u73AF\u5883\uFF08Windows / macOS\uFF09\u3002",
  cliTitle: "dsh \u547D\u4EE4",
  cliIntro: "\u5BF9\u6BD4\u7528\u6237 PATH \u4E0A\u7684 `dsh` \u4E0E\u542F\u52A8\u5F53\u524D Host \u6240\u7528\u7684\u542F\u52A8\u5668\u3002",
  cliActive: "PATH \u4E0A\uFF1A{path}",
  cliActiveMissing: "PATH \u4E0A\uFF1A\u672A\u627E\u5230",
  cliExpected: "\u5F53\u524D Host \u671F\u671B\uFF1A{path}",
  cliExpectedMissing: "\u5F53\u524D Host \u671F\u671B\uFF1A\u65E0\u6CD5\u63A8\u65AD",
  cliMatches: "PATH \u5DF2\u6307\u5411\u672C Host \u7684\u542F\u52A8\u5668\u3002",
  cliInstall: "\u4E3A\u672C Host \u5B89\u88C5 dsh",
  cliInstallHint: "\u65B0\u5F00\u7EC8\u7AEF\u5C06\u4F7F\u7528\u672C Host \u7684\u542F\u52A8\u5668\u3002\u5DF2\u6253\u5F00\u7684\u7EC8\u7AEF\u9700\u91CD\u542F\u540E\u624D\u80FD\u770B\u5230 PATH \u53D8\u66F4\u3002",
  cliMacConflict: "\u5728 macOS \u4E0A\u4F1A\u5199\u5165 /usr/local/bin/dsh\uFF0C\u53EF\u80FD\u8986\u76D6 Desktop\u300C\u7BA1\u7406 dsh \u547D\u4EE4\u2026\u300D\u5B89\u88C5\u7684\u94FE\u63A5\u3002",
  cliInstallOk: "\u5DF2\u5B89\u88C5\u3002\u8BF7\u65B0\u5F00\u7EC8\u7AEF\u4EE5\u4F7F\u7528\u66F4\u65B0\u540E\u7684 dsh\u3002",
  cliInstallError: "\u65E0\u6CD5\u5B89\u88C5 dsh \u547D\u4EE4\u3002",
  cliReasonUnresolved: "\u65E0\u6CD5\u63A8\u65AD\u672C Host \u7684\u542F\u52A8\u5668\u8DEF\u5F84\uFF0C\u56E0\u6B64\u4E0D\u80FD\u5B89\u88C5\u3002",
  cliReasonUnsupported: "\u4EC5\u652F\u6301\u5728 Windows \u4E0E macOS \u4E0A\u5B89\u88C5 CLI\u3002"
};

// src/client/mount.ts
var inject = ["remote", "slots", "locale"];
function registerUi(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "custom-env: dictionaries");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "env",
    order: 25,
    label: () => t("nav"),
    locale: NS,
    inject: () => ({
      load: async () => {
        const result = await ctx.remote.customEnv.list();
        if (!result.ok) throw result.error;
        return result.value;
      },
      upsert: async (name, value) => {
        const result = await ctx.remote.customEnv.upsert(name, value);
        if (!result.ok) throw result.error;
        return result.value;
      },
      remove: async (name) => {
        const result = await ctx.remote.customEnv.remove(name);
        if (!result.ok) throw result.error;
        return result.value;
      },
      cliStatus: async () => {
        const result = await ctx.remote.customEnv.cliStatus();
        if (!result.ok) throw result.error;
        return result.value;
      },
      cliInstall: async () => {
        const result = await ctx.remote.customEnv.cliInstall();
        if (!result.ok) throw result.error;
        return result.value;
      }
    })
  }, EnvSettingsSection));
}
async function mountCustomEnv(ctx, contribution) {
  const unmountRemote = await ctx.remote.$mount(contribution);
  const ui = ctx.inject(["remote.customEnv", "slots", "locale"], (child) => registerUi(child));
  try {
    await ui;
  } catch (error) {
    await ui.dispose();
    await unmountRemote();
    throw error;
  }
  return async () => {
    await ui.dispose();
    await unmountRemote();
  };
}

// src/client/index.ts
async function apply(ctx) {
  return await mountCustomEnv(ctx, typert_remote_client_default);
}
return module.exports;
	}
});
//# sourceMappingURL=client.js.map
