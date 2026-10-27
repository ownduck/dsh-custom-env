window.__ModuleLoader__.load({ id: "@woosau/dsh-custom-env", factory: (require) => {
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
    id: import_zod.z.string().readonly(),
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
var upsert$parameter$2$schema$value;
var upsert$parameter$2$schema = () => upsert$parameter$2$schema$value ??= import_zod.z.string();
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
          id: { type: "string" },
          name: { type: "string" },
          value: { type: "string" },
          kind: { type: "string", enum: ["unchanged", "modified", "added"] },
          previous: { type: ["string", "null"] }
        },
        required: ["id", "name", "value", "kind", "previous"],
        additionalProperties: true
      }
    }
  },
  required: ["path", "exists", "entries"],
  additionalProperties: true
};
var TYPERT_REMOTE = createTypertRemoteInfo({
  package: "@woosau/dsh-custom-env",
  methods: {
    "customEnv/list": {
      service: "customEnv",
      description: "List current $DSH_HOME/.env entries with pending classification.",
      invocation: { kind: "direct" },
      parameters: [],
      result: {
        mode: "strict",
        typeSymbol: "@woosau/dsh-custom-env/types#EnvSnapshot",
        create: list$result$schema,
        description: "path, existence, and sorted entries.",
        jsonSchema: envSnapshotJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/upsert": {
      service: "customEnv",
      description: "Create or update one row. Empty id creates a new row; otherwise keeps that baseline id across renames.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "id",
          description: "stable row id from list(), or empty string for a new row.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: upsert$parameter$0$schema,
            jsonSchema: { type: "string" }
          }
        },
        {
          name: "name",
          description: "writable variable name.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "string",
            create: upsert$parameter$1$schema,
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
            create: upsert$parameter$2$schema,
            jsonSchema: { type: "string" }
          }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "@woosau/dsh-custom-env/types#EnvSnapshot",
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
          name: "id",
          description: "stable row id from list().",
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
        typeSymbol: "@woosau/dsh-custom-env/types#EnvSnapshot",
        create: list$result$schema,
        description: "updated snapshot.",
        jsonSchema: envSnapshotJsonSchema
      },
      sourceLocation: { file: "src/index.ts", line: 1, column: 1 }
    },
    "customEnv/restore": {
      service: "customEnv",
      description: "Restore Host-start original name+value for this id, or delete if added after start.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "id",
          description: "stable row id from list().",
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
        typeSymbol: "@woosau/dsh-custom-env/types#EnvSnapshot",
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
        typeSymbol: "@woosau/dsh-custom-env/types#CliStatus",
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
        typeSymbol: "@woosau/dsh-custom-env/types#CliStatus",
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

// src/client/format-remote-error.ts
function isRemoteFailure(value) {
  return typeof value === "object" && value !== null && value.isDSHRemoteError === true && typeof value.code === "string";
}
function formatRemoteError(error, t) {
  if (isRemoteFailure(error)) {
    if (error.code === "custom-env/invalid-name") return t("error.invalidName");
    if (error.code === "custom-env/invalid-value") return t("error.invalidValue");
    if (error.code === "custom-env/restore-failed") return t("error.restoreFailed");
    if (error.code === "custom-env/cli-install-failed") return t("error.cliInstall");
  }
  return t("error.generic");
}

// src/client/EnvSettingsSection.module.css
var css = ".EnvSettingsSection_section {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  max-width: 760px;\n  color: var(--dsw-alias-label-primary);\n}\n\n.EnvSettingsSection_heading {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 500;\n  line-height: 1.3;\n}\n\n/* \u2014\u2014 dsh CLI: exactly two lines (label + path) \u2014\u2014 */\n.EnvSettingsSection_cli {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.EnvSettingsSection_cliHeading {\n  margin: 0;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.EnvSettingsSection_cliBody {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 28px;\n  gap: 8px;\n  align-items: center;\n  height: 28px;\n}\n\n.EnvSettingsSection_cliPath {\n  margin: 0;\n  min-width: 0;\n  font-size: 13px;\n  line-height: 28px;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.EnvSettingsSection_cliSlot {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  align-items: center;\n  justify-content: center;\n}\n\n.EnvSettingsSection_cliSlot[data-empty='true'] {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.EnvSettingsSection_notice,\n.EnvSettingsSection_empty {\n  margin: 0;\n  font-size: 13px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.EnvSettingsSection_notice[data-tone='error'] {\n  color: var(--dsw-alias-label-danger, #c62828);\n}\n\n/* \u2014\u2014 variable list: CSS grid, not table (avoids Input overflow overlap) \u2014\u2014 */\n.EnvSettingsSection_list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  min-width: 0;\n}\n\n.EnvSettingsSection_header,\n.EnvSettingsSection_row {\n  display: grid;\n  grid-template-columns: minmax(120px, 0.85fr) minmax(0, 1.55fr) 100px;\n  gap: 10px;\n  align-items: center;\n  min-width: 0;\n}\n\n.EnvSettingsSection_header {\n  padding: 0 0 2px;\n}\n\n.EnvSettingsSection_headerLabel {\n  margin: 0;\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 1.3;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.EnvSettingsSection_headerActions {\n  width: 100px;\n}\n\n.EnvSettingsSection_field {\n  min-width: 0;\n  overflow: hidden;\n}\n\n.EnvSettingsSection_fieldInput {\n  display: flex;\n  box-sizing: border-box;\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n}\n\n.EnvSettingsSection_actions {\n  display: grid;\n  grid-template-columns: repeat(3, 28px);\n  gap: 4px;\n  align-items: center;\n  justify-content: end;\n  width: 100px;\n  margin-left: auto;\n  flex-shrink: 0;\n}\n\n.EnvSettingsSection_slot {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  align-items: center;\n  justify-content: center;\n}\n\n.EnvSettingsSection_slot[data-empty='true'] {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.EnvSettingsSection_iconButton {\n  display: inline-flex;\n  width: 28px;\n  height: 28px;\n  margin: 0;\n  padding: 0;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n}\n\n.EnvSettingsSection_iconButton:hover:not(:disabled) {\n  background: var(--dsw-alias-fill-hover, rgba(127, 127, 127, 0.12));\n  color: var(--dsw-alias-label-primary);\n}\n\n.EnvSettingsSection_iconButton:disabled {\n  opacity: 0.45;\n  cursor: default;\n}\n\n.EnvSettingsSection_iconButtonDanger:hover:not(:disabled) {\n  color: var(--dsw-alias-label-danger, #c62828);\n}\n\n.EnvSettingsSection_iconButtonPrimary {\n  color: var(--dsw-alias-brand-primary, #247bbf);\n}\n\n.EnvSettingsSection_restartBadge {\n  display: inline-flex;\n  width: 28px;\n  height: 28px;\n  align-items: center;\n  justify-content: center;\n  color: var(--dsw-alias-label-warning, #c67c00);\n}\n\n.EnvSettingsSection_spinner {\n  animation: spin 1s linear infinite;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .EnvSettingsSection_spinner {\n    animation: none;\n  }\n}\n";
if (typeof document !== "undefined" && !document.getElementById("dsh-custom-env-css")) {
  const style = document.createElement("style");
  style.id = "dsh-custom-env-css";
  style.textContent = css;
  document.head.appendChild(style);
}
var EnvSettingsSection_default = { "section": "EnvSettingsSection_section", "heading": "EnvSettingsSection_heading", "cli": "EnvSettingsSection_cli", "cliHeading": "EnvSettingsSection_cliHeading", "cliBody": "EnvSettingsSection_cliBody", "cliPath": "EnvSettingsSection_cliPath", "cliSlot": "EnvSettingsSection_cliSlot", "notice": "EnvSettingsSection_notice", "empty": "EnvSettingsSection_empty", "list": "EnvSettingsSection_list", "header": "EnvSettingsSection_header", "row": "EnvSettingsSection_row", "headerLabel": "EnvSettingsSection_headerLabel", "headerActions": "EnvSettingsSection_headerActions", "field": "EnvSettingsSection_field", "fieldInput": "EnvSettingsSection_fieldInput", "actions": "EnvSettingsSection_actions", "slot": "EnvSettingsSection_slot", "iconButton": "EnvSettingsSection_iconButton", "iconButtonDanger": "EnvSettingsSection_iconButtonDanger", "iconButtonPrimary": "EnvSettingsSection_iconButtonPrimary", "restartBadge": "EnvSettingsSection_restartBadge", "spinner": "EnvSettingsSection_spinner" };

// src/client/EnvSettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var NEW_ID = "";
function IconAction({
  label,
  disabled,
  onClick,
  danger,
  primary,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { portal: true, label, side: "top", delayMs: 400, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      className: [EnvSettingsSection_default.iconButton, danger ? EnvSettingsSection_default.iconButtonDanger : "", primary ? EnvSettingsSection_default.iconButtonPrimary : ""].filter(Boolean).join(" "),
      "aria-label": label,
      title: label,
      disabled,
      onClick,
      children
    }
  ) });
}
function Slot({ empty, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.slot, "data-empty": empty ? "true" : "false", children: empty ? null : children });
}
function RowActions({
  t,
  busy,
  loading,
  dirty,
  canConfirm,
  pending = false,
  showRemove = true,
  onConfirm,
  onCancel,
  onRestore,
  onRemove
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.actions, role: "group", "aria-label": t("field.actions"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !dirty && !pending, children: dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: loading ? t("panel.loading") : t("action.confirm"), primary: true, disabled: busy || !canConfirm, onClick: onConfirm, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLoadingOutlineRegular, { className: EnvSettingsSection_default.spinner, size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCheckOutlineRegular, { size: 14 }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { portal: true, label: t("status.restartRequired"), side: "top", delayMs: 400, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: EnvSettingsSection_default.restartBadge, role: "img", "aria-label": t("status.restartRequired"), title: t("status.restartRequired"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconWarningOutlineRegular, { size: 14 }) }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !dirty && !pending, children: dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.cancel"), disabled: busy, onClick: onCancel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 14 }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.restore"), disabled: busy, onClick: onRestore, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 14 }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !showRemove, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.remove"), danger: true, disabled: busy, onClick: onRemove, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconTrashOutlineRegular, { size: 14 }) }) })
  ] });
}
function Field(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.field, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Input,
    {
      className: EnvSettingsSection_default.fieldInput,
      id: props.id,
      value: props.value,
      disabled: props.disabled,
      placeholder: props.placeholder,
      title: props.title,
      "aria-invalid": props.invalid || void 0,
      "aria-label": props.label,
      onChange: (event) => {
        props.onChange(event.target.value);
      }
    }
  ) });
}
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
  const [drafts, setDrafts] = (0, import_react.useState)({ [NEW_ID]: { name: "", value: "" } });
  const [busyTarget, setBusyTarget] = (0, import_react.useState)();
  const [error, setError] = (0, import_react.useState)();
  const [nameError, setNameError] = (0, import_react.useState)(false);
  const [pendingRemove, setPendingRemove] = (0, import_react.useState)();
  const busy = busyTarget !== void 0;
  const entries = snapshot?.entries ?? [];
  const taken = new Set(entries.map((entry) => entry.name));
  const applySnapshot = (next) => {
    setSnapshot(next);
    setDrafts({
      [NEW_ID]: { name: "", value: "" },
      ...Object.fromEntries(next.entries.map((entry) => [entry.id, { name: entry.name, value: entry.value }]))
    });
  };
  const setDraft = (id, patch) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: { name: patch.name ?? previous[id]?.name ?? "", value: patch.value ?? previous[id]?.value ?? "" }
    }));
  };
  const run = async (target, action) => {
    if (busyTarget !== void 0) return;
    setBusyTarget(target);
    setError(void 0);
    try {
      applySnapshot(await action());
    } catch (err) {
      setError(formatRemoteError(err, t));
    } finally {
      setBusyTarget(void 0);
    }
  };
  const refresh = (0, import_react.useCallback)(async () => {
    setBusyTarget("boot");
    setError(void 0);
    try {
      applySnapshot(await load());
      try {
        setCli(await cliStatus());
      } catch {
        setCli(void 0);
      }
    } catch (err) {
      setError(formatRemoteError(err, t));
    } finally {
      setBusyTarget(void 0);
    }
  }, [load, cliStatus, t]);
  (0, import_react.useEffect)(() => {
    void refresh();
  }, [refresh]);
  const saveRow = (id, entryName) => {
    const draft = drafts[id] ?? { name: "", value: "" };
    const name = draft.name.trim();
    const takenByOther = name !== entryName && taken.has(name);
    if (!NAME_OK.test(name) || takenByOther) {
      setNameError(true);
      return;
    }
    if (draft.value === "") return;
    setNameError(false);
    const target = id === NEW_ID ? "new" : `row:${id}`;
    void run(target, () => upsert(id, name, draft.value));
  };
  const newDraft = drafts[NEW_ID] ?? { name: "", value: "" };
  const newDirty = newDraft.name.trim() !== "" || newDraft.value !== "";
  const cliInstalling = busyTarget === "cli";
  const cliBooting = busyTarget === "boot" || cli === void 0;
  const showCliAction = cli?.canInstall === true || cliInstalling;
  const notice = error ?? (nameError ? t("error.invalidName") : void 0) ?? (cli?.reason === "could-not-resolve-expected-cli" ? t("error.cliUnresolved") : void 0) ?? (cli?.reason === "unsupported-platform" ? t("error.cliUnsupported") : void 0);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { className: EnvSettingsSection_default.heading, children: t("panel.title") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: EnvSettingsSection_default.cli, "aria-label": t("cli.title"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { className: EnvSettingsSection_default.cliHeading, children: t("cli.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.cliBody, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "p",
          {
            className: EnvSettingsSection_default.cliPath,
            title: cliBooting ? void 0 : cli.activePath ?? void 0,
            "aria-busy": cliBooting || cliInstalling,
            children: cliBooting ? t("panel.loading") : cli.activePath === null ? t("cli.activeMissing") : cli.activePath
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.cliSlot, "data-empty": showCliAction ? "false" : "true", children: showCliAction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          IconAction,
          {
            label: cliInstalling ? t("panel.loading") : cli?.platform === "darwin" ? t("cli.macConflict") : t("cli.install"),
            disabled: busy,
            onClick: () => {
              if (busyTarget !== void 0) return;
              setBusyTarget("cli");
              setError(void 0);
              void (async () => {
                try {
                  setCli(await cliInstall());
                } catch (err) {
                  setError(formatRemoteError(err, t));
                } finally {
                  setBusyTarget(void 0);
                }
              })();
            },
            children: cliInstalling ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLoadingOutlineRegular, { className: EnvSettingsSection_default.spinner, size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLinkOutlineRegular, { size: 14 })
          }
        ) : null })
      ] })
    ] }),
    notice !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.notice, "data-tone": error !== void 0 || nameError ? "error" : void 0, role: "status", children: notice }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.list, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.header, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.headerLabel, children: t("field.name") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.headerLabel, children: t("field.value") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.headerActions, "aria-hidden": "true" })
      ] }),
      snapshot !== void 0 && entries.length === 0 && notice === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.empty, children: t("panel.empty") }) : null,
      entries.map((entry) => {
        const draft = drafts[entry.id] ?? { name: entry.name, value: entry.value };
        const dirty = draft.name !== entry.name || draft.value !== entry.value;
        const pending = entry.kind === "added" || entry.kind === "modified";
        const loading = busyTarget === `row:${entry.id}`;
        const nextName = draft.name.trim();
        const canConfirm = NAME_OK.test(nextName) && draft.value !== "" && !(nextName !== entry.name && taken.has(nextName));
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Field,
            {
              id: `env-name-${entry.id}`,
              value: draft.name,
              disabled: busy,
              title: draft.name,
              invalid: nameError && dirty,
              label: t("field.name"),
              onChange: (name) => {
                setNameError(false);
                setDraft(entry.id, { name });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Field,
            {
              id: `env-value-${entry.id}`,
              value: draft.value,
              disabled: busy,
              title: draft.value,
              label: t("field.value"),
              onChange: (value) => {
                setDraft(entry.id, { value });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            RowActions,
            {
              t,
              busy,
              loading,
              dirty: dirty || loading,
              canConfirm,
              pending,
              onConfirm: () => {
                saveRow(entry.id, entry.name);
              },
              onCancel: () => {
                setNameError(false);
                setDraft(entry.id, { name: entry.name, value: entry.value });
              },
              onRestore: () => {
                void run(`row:${entry.id}`, () => restore(entry.id));
              },
              onRemove: () => {
                setPendingRemove({ id: entry.id, name: entry.name });
              }
            }
          )
        ] }, entry.id);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          Field,
          {
            id: "env-new-name",
            value: newDraft.name,
            disabled: busy,
            placeholder: t("field.namePlaceholder"),
            title: newDraft.name || t("field.namePlaceholder"),
            invalid: nameError,
            label: t("field.name"),
            onChange: (name) => {
              setNameError(false);
              setDraft(NEW_ID, { name });
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          Field,
          {
            id: "env-new-value",
            value: newDraft.value,
            disabled: busy,
            placeholder: t("field.valuePlaceholder"),
            title: newDraft.value || t("field.valuePlaceholder"),
            label: t("field.value"),
            onChange: (value) => {
              setDraft(NEW_ID, { value });
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          RowActions,
          {
            t,
            busy,
            loading: busyTarget === "new",
            dirty: newDirty || busyTarget === "new",
            canConfirm: NAME_OK.test(newDraft.name.trim()) && newDraft.value !== "" && !taken.has(newDraft.name.trim()),
            showRemove: false,
            onConfirm: () => {
              saveRow(NEW_ID, void 0);
            },
            onCancel: () => {
              setNameError(false);
              setDraft(NEW_ID, { name: "", value: "" });
            },
            onRestore: () => void 0,
            onRemove: () => void 0
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: pendingRemove !== void 0,
        onClose: () => {
          if (!busy) setPendingRemove(void 0);
        },
        title: t("action.removeConfirmTitle"),
        closeLabel: t("action.close"),
        description: pendingRemove ? t("action.removeConfirm", { name: pendingRemove.name }) : void 0,
        footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: () => {
            setPendingRemove(void 0);
          }, children: t("action.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              variant: "primary",
              disabled: busy,
              onClick: () => {
                if (pendingRemove === void 0 || busyTarget !== void 0) return;
                const { id } = pendingRemove;
                setPendingRemove(void 0);
                void run(`row:${id}`, () => remove(id));
              },
              children: t("action.remove")
            }
          )
        ] })
      }
    )
  ] });
}

// src/client/locales.ts
var NS = "settings.env";
var zh = {
  "panel.nav": "\u73AF\u5883\u53D8\u91CF",
  "panel.title": "\u73AF\u5883\u53D8\u91CF",
  "panel.empty": "\u6682\u65E0\u53D8\u91CF",
  "panel.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "field.name": "\u540D\u79F0",
  "field.value": "\u503C",
  "field.actions": "\u64CD\u4F5C",
  "field.namePlaceholder": "MY_VAR",
  "field.valuePlaceholder": "\u503C",
  "action.confirm": "\u786E\u5B9A",
  "action.cancel": "\u53D6\u6D88",
  "action.remove": "\u5220\u9664",
  "action.removeConfirmTitle": "\u5220\u9664\u53D8\u91CF",
  "action.removeConfirm": "\u5220\u9664 {name}\uFF1F",
  "action.restore": "\u6062\u590D\u539F\u503C",
  "action.close": "\u5173\u95ED",
  "status.restartRequired": "\u9700\u91CD\u542F\u5BA2\u6237\u7AEF",
  "cli.title": "dsh",
  "cli.activeMissing": "\u672A\u627E\u5230",
  "cli.install": "\u5B89\u88C5",
  "cli.macConflict": "\u5C06\u66FF\u6362 /usr/local/bin/dsh",
  "error.generic": "\u66F4\u65B0\u5931\u8D25",
  "error.invalidName": "\u540D\u79F0\u65E0\u6548",
  "error.invalidValue": "\u503C\u65E0\u6548",
  "error.restoreFailed": "\u6062\u590D\u5931\u8D25",
  "error.cliInstall": "\u5B89\u88C5\u5931\u8D25",
  "error.cliUnresolved": "\u65E0\u6CD5\u5B89\u88C5",
  "error.cliUnsupported": "\u4EC5 Windows / macOS"
};
var en = {
  "panel.nav": "Environment",
  "panel.title": "Environment",
  "panel.empty": "No variables",
  "panel.loading": "Loading\u2026",
  "field.name": "Name",
  "field.value": "Value",
  "field.actions": "Actions",
  "field.namePlaceholder": "MY_VAR",
  "field.valuePlaceholder": "value",
  "action.confirm": "Confirm",
  "action.cancel": "Cancel",
  "action.remove": "Delete",
  "action.removeConfirmTitle": "Delete variable",
  "action.removeConfirm": "Delete {name}?",
  "action.restore": "Restore original",
  "action.close": "Close",
  "status.restartRequired": "Restart the client",
  "cli.title": "dsh",
  "cli.activeMissing": "Not found",
  "cli.install": "Install",
  "cli.macConflict": "Replaces /usr/local/bin/dsh",
  "error.generic": "Update failed",
  "error.invalidName": "Invalid name",
  "error.invalidValue": "Invalid value",
  "error.restoreFailed": "Restore failed",
  "error.cliInstall": "Install failed",
  "error.cliUnresolved": "Install unavailable",
  "error.cliUnsupported": "Windows / macOS only"
};

// src/client/mount.ts
var inject = ["remote", "slots", "locale"];
function registerUi(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "custom-env: dictionaries");
  const t = ctx.locale.bind(NS);
  const call = async (result) => {
    if (!result.ok) throw result.error;
    return result.value;
  };
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "env",
    order: 25,
    label: () => t("panel.nav"),
    locale: NS,
    inject: () => ({
      load: async () => call(await ctx.remote.customEnv.list()),
      upsert: async (id, name, value) => call(await ctx.remote.customEnv.upsert(id, name, value)),
      remove: async (id) => call(await ctx.remote.customEnv.deleteEntry(id)),
      restore: async (id) => call(await ctx.remote.customEnv.restore(id)),
      cliStatus: async () => call(await ctx.remote.customEnv.cliStatus()),
      cliInstall: async () => call(await ctx.remote.customEnv.cliInstall())
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
