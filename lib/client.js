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

// ../vertax-work/packages/typert/protocol/lib/types/remote-info.js
function createTypertRemoteInfo(spec, zod) {
  return new RemoteInfo(spec, zod);
}
var RemoteInfo = class {
  spec;
  zod;
  index;
  constructor(spec, zod) {
    this.spec = spec;
    this.zod = zod;
  }
  get package() {
    return this.spec.package;
  }
  get descriptors() {
    return this.resolve().descriptors;
  }
  get methods() {
    return this.resolve().methods;
  }
  resolve() {
    if (this.index !== void 0)
      return this.index;
    const zod = this.zod;
    const descriptors = [];
    const methods = /* @__PURE__ */ Object.create(null);
    for (const [endpoint, definition] of Object.entries(this.spec.methods)) {
      const separator = endpoint.indexOf("/");
      const namespace = endpoint.slice(0, separator);
      const method = endpoint.slice(separator + 1);
      const parameters = definition.parameters.map((parameter) => ({ ...parameter, wire: parameter.wire ?? parameter.name }));
      const descriptor = {
        ...definition,
        id: `${this.spec.package}#${endpoint}`,
        namespace,
        method,
        parameters,
        result: definition.result.description === void 0 ? definition.result : new ResultValue(definition.result)
      };
      if (definition.invocation.kind === "direct") {
        const inputs = [];
        const direct = Object.assign(descriptor, {
          input(options) {
            const strict = options?.strict === true;
            return inputs[strict ? 1 : 0] ??= new NamedInput(parameters, strict, zod);
          },
          invoke(remote, input, signal) {
            const named = input;
            const values = parameters.map((parameter) => named[parameter.wire]);
            if (definition.cancellation !== void 0)
              values.push(signal);
            const receiver = Reflect.get(remote, namespace);
            const call = Reflect.get(receiver, method);
            return call.apply(receiver, values);
          }
        });
        methods[endpoint] = direct;
      }
      descriptors.push(descriptor);
    }
    return this.index = { descriptors, methods };
  }
};
function optional(parameter) {
  return parameter.source === "json" && parameter.acceptsUndefined === true;
}
var NamedInput = class {
  parameters;
  strict;
  zod;
  schema;
  projection;
  constructor(parameters, strict, zod) {
    this.parameters = parameters;
    this.strict = strict;
    this.zod = zod;
  }
  codec(parameter) {
    return this.strict ? parameter.strictCodec : parameter.codec;
  }
  create = () => this.schema ??= this.zod.strictObject(Object.fromEntries(this.parameters.map((parameter) => {
    const value = this.codec(parameter).create();
    return [parameter.wire, optional(parameter) ? value.optional() : value.nonoptional()];
  })));
  get jsonSchema() {
    return this.project().jsonSchema;
  }
  get jsonSchemaError() {
    return this.project().jsonSchemaError;
  }
  project() {
    if (this.projection !== void 0)
      return this.projection;
    const unavailable = this.parameters.find((parameter) => this.codec(parameter).jsonSchema === void 0);
    if (unavailable !== void 0) {
      return this.projection = { jsonSchemaError: this.codec(unavailable).jsonSchemaError ?? `No JSON Schema for parameter ${unavailable.wire}` };
    }
    return this.projection = {
      jsonSchema: {
        type: "object",
        properties: Object.fromEntries(this.parameters.map((parameter) => [parameter.wire, {
          ...this.codec(parameter).jsonSchema,
          ...parameter.description === void 0 ? {} : { description: parameter.description }
        }])),
        required: this.parameters.filter((parameter) => !optional(parameter)).map((parameter) => parameter.wire),
        additionalProperties: false
      }
    };
  }
};
var ResultValue = class {
  spec;
  projection;
  constructor(spec) {
    this.spec = spec;
  }
  get mode() {
    return this.spec.mode;
  }
  get typeSymbol() {
    return this.spec.typeSymbol;
  }
  get create() {
    return this.spec.create;
  }
  get decode() {
    return this.spec.decode;
  }
  get encode() {
    return this.spec.encode;
  }
  get description() {
    return this.spec.description;
  }
  get jsonSchemaError() {
    return this.spec.jsonSchemaError;
  }
  get jsonSchema() {
    if (this.projection === void 0) {
      const schema = this.spec.jsonSchema;
      this.projection = { value: schema === void 0 ? void 0 : { ...schema, description: this.spec.description } };
    }
    return this.projection.value;
  }
};

// lib/typert.remote-client.js
var list$result$schema$value;
var list$result$schema = () => list$result$schema$value ??= import_zod.z.object({
  path: import_zod.z.string().readonly(),
  exists: import_zod.z.boolean().readonly(),
  entries: import_zod.z.array(import_zod.z.object({
    name: import_zod.z.string().readonly(),
    value: import_zod.z.string().readonly(),
    kind: import_zod.z.enum(["unchanged", "modified", "added"]).readonly(),
    previous: import_zod.z.string().nullable().readonly()
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
var restore$parameter$0$schema$value;
var restore$parameter$0$schema = () => restore$parameter$0$schema$value ??= import_zod.z.string();
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
        properties: {
          name: { type: "string" },
          value: { type: "string" },
          kind: { type: "string", enum: ["unchanged", "modified", "added"] },
          previous: { type: ["string", "null"] }
        },
        required: ["name", "value", "kind", "previous"],
        additionalProperties: true
      }
    }
  },
  required: ["path", "exists", "entries"],
  additionalProperties: true
};
var TYPERT_REMOTE = createTypertRemoteInfo({
  package: "dsh-custom-env",
  methods: {
    "customEnv/list": {
      service: "customEnv",
      description: "List current $DSH_HOME/.env entries with pending classification.",
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
    "customEnv/deleteEntry": {
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
    "customEnv/restore": {
      service: "customEnv",
      description: "Write a modified entry back to its Host-start baseline value.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "name",
          description: "variable that exists in the baseline and differs from it.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: restore$parameter$0$schema,
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
var css = ".EnvSettingsSection_section{\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  max-width: 760px;\n  color: var(--dsw-alias-label-primary);\n}\n\n.EnvSettingsSection_heading{\n  margin: 0;\n  font-size: 18px;\n  font-weight: 600;\n}\n\n.intro,\n.path,\n.hint,\n.empty,\n.EnvSettingsSection_status{\n  margin: 0;\n  font-size: 13px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.status[data-tone='error'] {\n  color: var(--dsw-alias-label-danger, #c62828);\n}\n\n.status[data-tone='ok'] {\n  color: var(--dsw-alias-label-success, #2e7d32);\n}\n\n.EnvSettingsSection_cli{\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 12px 0;\n  border-top: 1px solid var(--dsw-alias-border-subtle, rgba(127, 127, 127, 0.25));\n  border-bottom: 1px solid var(--dsw-alias-border-subtle, rgba(127, 127, 127, 0.25));\n}\n\n.EnvSettingsSection_cliHeading{\n  margin: 0;\n  font-size: 15px;\n  font-weight: 600;\n}\n\n.EnvSettingsSection_cliActions{\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  align-items: flex-start;\n}\n\n.EnvSettingsSection_list{\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.EnvSettingsSection_row{\n  display: grid;\n  grid-template-columns: minmax(120px, 1fr) minmax(160px, 2fr) auto;\n  gap: 8px;\n  align-items: center;\n}\n\n.EnvSettingsSection_actions{\n  display: flex;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n\n.EnvSettingsSection_add{\n  display: grid;\n  grid-template-columns: minmax(120px, 1fr) minmax(160px, 2fr) auto;\n  gap: 8px;\n  align-items: end;\n  margin-top: 4px;\n}\n\n.EnvSettingsSection_field{\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n\n.field label {\n  font-size: 12px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.EnvSettingsSection_pending{\n  margin: 4px 0 0;\n  font-size: 12px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-warning, #c67c00);\n}\n";
if (typeof document !== "undefined" && !document.getElementById("dsh-custom-env-css")) {
  const style = document.createElement("style");
  style.id = "dsh-custom-env-css";
  style.textContent = css;
  document.head.appendChild(style);
}
var EnvSettingsSection_default = { "section": "EnvSettingsSection_section", "heading": "EnvSettingsSection_heading", "status": "EnvSettingsSection_status", "cli": "EnvSettingsSection_cli", "cliHeading": "EnvSettingsSection_cliHeading", "cliActions": "EnvSettingsSection_cliActions", "list": "EnvSettingsSection_list", "row": "EnvSettingsSection_row", "actions": "EnvSettingsSection_actions", "add": "EnvSettingsSection_add", "field": "EnvSettingsSection_field", "pending": "EnvSettingsSection_pending" };

// src/client/EnvSettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function EnvSettingsSection({
  t,
  load,
  upsert,
  remove,
  restore,
  cliStatus,
  cliInstall
}) {
  const [snapshot, setSnapshot] = (0, import_react.useState)();
  const [cli, setCli] = (0, import_react.useState)();
  const [drafts, setDrafts] = (0, import_react.useState)({});
  const [newName, setNewName] = (0, import_react.useState)("");
  const [newValue, setNewValue] = (0, import_react.useState)("");
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  const [cliNotice, setCliNotice] = (0, import_react.useState)();
  const [nameError, setNameError] = (0, import_react.useState)(false);
  const applySnapshot = (next) => {
    setSnapshot(next);
    const nextDrafts = {};
    for (const entry of next.entries) nextDrafts[entry.name] = entry.value;
    setDrafts(nextDrafts);
  };
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
      applySnapshot(await load());
      await refreshCli();
    } catch {
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
      applySnapshot(await action());
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  };
  const newNameTrimmed = newName.trim();
  const newDraftDirty = newNameTrimmed !== "" || newValue !== "";
  const newCanConfirm = NAME_OK.test(newNameTrimmed) && newValue !== "";
  const onConfirmNew = () => {
    if (!NAME_OK.test(newNameTrimmed)) {
      setNameError(true);
      return;
    }
    if (newValue === "") return;
    setNameError(false);
    void run(async () => {
      const next = await upsert(newNameTrimmed, newValue);
      setNewName("");
      setNewValue("");
      return next;
    });
  };
  const onCancelNew = () => {
    setNewName("");
    setNewValue("");
    setNameError(false);
  };
  const onInstallCli = () => {
    setBusy(true);
    setError(void 0);
    setCliNotice(void 0);
    void (async () => {
      try {
        setCli(await cliInstall());
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
  const pendingTip = (entry) => {
    if (entry.kind === "added") return t("restartRequiredAdded");
    if (entry.kind === "modified") return t("restartRequired");
    return void 0;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: EnvSettingsSection_default.heading, children: t("title") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.intro, children: t("intro") }),
    snapshot !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.path, children: t("path", { path: snapshot.path }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: t("osSync") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.cli, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: EnvSettingsSection_default.cliHeading, children: t("cliTitle") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: t("cliIntro") }),
      cli === void 0 && busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.status, children: t("loading") }) : null,
      cli !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.path, children: cli.activePath === null ? t("cliActiveMissing") : t("cliActive", { path: cli.activePath }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.path, children: cli.expectedPath === null ? t("cliExpectedMissing") : t("cliExpected", { path: cli.expectedPath }) }),
        cli.matches ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: t("cliMatches") }) : null,
        cliReasonCopy(cli) !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: cliReasonCopy(cli) }) : null,
        cli.canInstall ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.cliActions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: t("cliInstallHint") }),
          cli.platform === "darwin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.hint, children: t("cliMacConflict") }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: busy, onClick: onInstallCli, children: t("cliInstall") })
        ] }) : null,
        cliNotice !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.status, "data-tone": "ok", role: "status", children: cliNotice }) : null
      ] }) : null
    ] }),
    error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.status, "data-tone": "error", role: "status", children: error }),
    snapshot === void 0 && busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.status, children: t("loading") }) : null,
    snapshot !== void 0 && snapshot.entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.empty, children: t("empty") }) : null,
    snapshot !== void 0 && snapshot.entries.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: EnvSettingsSection_default.list, children: snapshot.entries.map((entry) => {
      const draft = drafts[entry.name] ?? entry.value;
      const dirty = draft !== entry.value;
      const tip = pendingTip(entry);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: EnvSettingsSection_default.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { children: t("name") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Input, { value: entry.name, disabled: true, readOnly: true, "aria-label": t("name") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.field, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: `env-value-${entry.name}`, children: t("value") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Input,
            {
              id: `env-value-${entry.name}`,
              value: draft,
              disabled: busy,
              "aria-label": t("value"),
              onChange: (event) => {
                const value = event.target.value;
                setDrafts((previous) => ({ ...previous, [entry.name]: value }));
              }
            }
          ),
          tip !== void 0 && !dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.pending, role: "status", children: tip }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.actions, children: [
          dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Button,
              {
                size: "sm",
                variant: "primary",
                disabled: busy || draft === "",
                onClick: () => {
                  void run(() => upsert(entry.name, draft));
                },
                children: t("confirm")
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              import_dsh_client_ui_primitives.Button,
              {
                size: "sm",
                variant: "outline",
                disabled: busy,
                onClick: () => {
                  setDrafts((previous) => ({ ...previous, [entry.name]: entry.value }));
                },
                children: t("cancel")
              }
            )
          ] }) : null,
          entry.kind === "modified" && !dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              size: "sm",
              variant: "outline",
              disabled: busy,
              onClick: () => {
                void run(() => restore(entry.name));
              },
              children: t("restore")
            }
          ) : null,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              size: "sm",
              variant: "ghost",
              disabled: busy,
              onClick: () => {
                void run(() => remove(entry.name));
              },
              children: t("remove")
            }
          )
        ] })
      ] }, entry.name);
    }) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.add, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.field, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "env-new-name", children: t("name") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.field, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { htmlFor: "env-new-value", children: t("value") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.actions, children: newDraftDirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", disabled: busy || !newCanConfirm, onClick: onConfirmNew, children: t("confirm") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: onCancelNew, children: t("cancel") })
      ] }) : null })
    ] }),
    nameError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.status, "data-tone": "error", role: "status", children: t("invalidName") }) : null
  ] });
}

// src/client/locales.ts
var NS = "settings.env";
var en = {
  nav: "Environment",
  title: "Environment variables",
  intro: "Confirm writes to $DSH_HOME/.env and applies to this Host immediately. Restart DSH / open a new terminal for the full OS effect. Cancel only reverts the input.",
  path: "File: {path}",
  empty: "No variables yet. Add a name and value below, then Confirm.",
  name: "Name",
  value: "Value",
  confirm: "Confirm",
  cancel: "Cancel",
  remove: "Remove",
  restore: "Restore",
  namePlaceholder: "MY_VAR",
  valuePlaceholder: "value",
  loading: "Loading\u2026",
  error: "Could not update environment variables.",
  invalidName: "Use a letter or underscore first; letters, digits, and underscores after. Bootstrap names (PATH, DSH_*, \u2026) are blocked.",
  osSync: "Synced to OS user environment (Windows / macOS).",
  restartRequired: "Restart required for full effect.",
  restartRequiredAdded: "New item \u2014 restart required for full effect.",
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
  intro: "\u70B9\u300C\u786E\u5B9A\u300D\u624D\u5199\u5165 $DSH_HOME/.env \u5E76\u7ACB\u523B\u4F5C\u7528\u4E8E\u5F53\u524D Host\u3002\u300C\u53D6\u6D88\u300D\u53EA\u6062\u590D\u8F93\u5165\u6846\u3002\u5B8C\u6574\u751F\u6548\u8BF7\u91CD\u542F DSH / \u65B0\u5F00\u7EC8\u7AEF\u3002",
  path: "\u6587\u4EF6\uFF1A{path}",
  empty: "\u8FD8\u6CA1\u6709\u53D8\u91CF\u3002\u5728\u4E0B\u65B9\u586B\u5199\u540D\u79F0\u548C\u503C\u540E\u70B9\u300C\u786E\u5B9A\u300D\u3002",
  name: "\u540D\u79F0",
  value: "\u503C",
  confirm: "\u786E\u5B9A",
  cancel: "\u53D6\u6D88",
  remove: "\u5220\u9664",
  restore: "\u6062\u590D",
  namePlaceholder: "MY_VAR",
  valuePlaceholder: "\u503C",
  loading: "\u52A0\u8F7D\u4E2D\u2026",
  error: "\u65E0\u6CD5\u66F4\u65B0\u73AF\u5883\u53D8\u91CF\u3002",
  invalidName: "\u540D\u79F0\u987B\u4EE5\u5B57\u6BCD\u6216\u4E0B\u5212\u7EBF\u5F00\u5934\uFF0C\u5176\u540E\u53EF\u4E3A\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\uFF1B\u7981\u6B62 PATH\u3001DSH_* \u7B49\u542F\u52A8\u76F8\u5173\u540D\u3002",
  osSync: "\u5DF2\u540C\u6B65\u5230\u64CD\u4F5C\u7CFB\u7EDF\u7528\u6237\u73AF\u5883\uFF08Windows / macOS\uFF09\u3002",
  restartRequired: "\u9700\u91CD\u542F\u624D\u5B8C\u5168\u751F\u6548\u3002",
  restartRequiredAdded: "\u65B0\u589E\u9879 \u2014 \u9700\u91CD\u542F\u624D\u5B8C\u5168\u751F\u6548\u3002",
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
        const result = await ctx.remote.customEnv.deleteEntry(name);
        if (!result.ok) throw result.error;
        return result.value;
      },
      restore: async (name) => {
        const result = await ctx.remote.customEnv.restore(name);
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
