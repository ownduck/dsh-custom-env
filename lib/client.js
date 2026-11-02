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
var envGroupSchema = () => import_zod.z.object({
  id: import_zod.z.string().readonly(),
  title: import_zod.z.string().readonly()
}).readonly();
var envEntrySchema = () => import_zod.z.object({
  id: import_zod.z.string().readonly(),
  name: import_zod.z.string().readonly(),
  value: import_zod.z.string().readonly(),
  groupId: import_zod.z.string().readonly(),
  kind: import_zod.z.enum(["unchanged", "modified", "added"]).readonly(),
  previous: import_zod.z.string().nullable().readonly()
}).readonly();
var list$result$schema$value;
var list$result$schema = () => list$result$schema$value ??= import_zod.z.object({
  path: import_zod.z.string().readonly(),
  exists: import_zod.z.boolean().readonly(),
  groups: import_zod.z.array(envGroupSchema()).readonly(),
  entries: import_zod.z.array(envEntrySchema()).readonly()
});
var envGroup$result$schema$value;
var envGroup$result$schema = () => envGroup$result$schema$value ??= envGroupSchema();
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
var str = () => import_zod.z.string();
var setVars$parameter$0$schema$value;
var setVars$parameter$0$schema = () => setVars$parameter$0$schema$value ??= import_zod.z.array(import_zod.z.object({
  name: import_zod.z.string().readonly(),
  value: import_zod.z.string().readonly(),
  group: import_zod.z.string().optional()
}).readonly()).readonly();
var removeVars$parameter$0$schema$value;
var removeVars$parameter$0$schema = () => removeVars$parameter$0$schema$value ??= import_zod.z.array(import_zod.z.string()).readonly();
var deleteGroup$parameter$1$schema$value;
var deleteGroup$parameter$1$schema = () => deleteGroup$parameter$1$schema$value ??= import_zod.z.object({
  moveToDefault: import_zod.z.boolean().readonly()
}).readonly();
var envVarWriteJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    value: { type: "string" },
    group: { type: "string" }
  },
  required: ["name", "value"],
  additionalProperties: false
};
var envGroupJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" }
  },
  required: ["id", "title"],
  additionalProperties: true
};
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
    groups: {
      type: "array",
      items: envGroupJsonSchema
    },
    entries: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          value: { type: "string" },
          groupId: { type: "string" },
          kind: { type: "string", enum: ["unchanged", "modified", "added"] },
          previous: { type: ["string", "null"] }
        },
        required: ["id", "name", "value", "groupId", "kind", "previous"],
        additionalProperties: true
      }
    }
  },
  required: ["path", "exists", "groups", "entries"],
  additionalProperties: true
};
var stringParam = (name, description, options = {}) => ({
  name,
  description,
  source: "json",
  ...options.acceptsUndefined ? { acceptsUndefined: true } : {},
  codec: {
    mode: "strict",
    typeSymbol: "string",
    create: str,
    jsonSchema: { type: "string" }
  }
});
var snapshotResult = (description = "updated snapshot.") => ({
  mode: "strict",
  typeSymbol: "@woosau/dsh-custom-env/types#EnvSnapshot",
  create: list$result$schema,
  description,
  jsonSchema: envSnapshotJsonSchema
});
var groupResult = (description = "group record.") => ({
  mode: "strict",
  typeSymbol: "@woosau/dsh-custom-env/types#EnvGroup",
  create: envGroup$result$schema,
  description,
  jsonSchema: envGroupJsonSchema
});
var voidResult = {
  mode: "strict",
  typeSymbol: "void",
  create: () => import_zod.z.undefined(),
  description: "no return value.",
  jsonSchema: { type: "null" }
};
var src = { file: "src/index.ts", line: 1, column: 1 };
var TYPERT_REMOTE = createTypertRemoteInfo({
  package: "@woosau/dsh-custom-env",
  methods: {
    "customEnv/list": {
      service: "customEnv",
      description: "List current $DSH_HOME/.env entries with groups and pending classification.",
      invocation: { kind: "direct" },
      parameters: [],
      result: snapshotResult("path, existence, groups, and sorted entries."),
      sourceLocation: src
    },
    "customEnv/upsert": {
      service: "customEnv",
      description: "Create or update one row. Empty id creates a new row; optional groupId assigns membership.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "stable row id from list(), or empty string for a new row."),
        stringParam("name", "writable variable name."),
        stringParam("value", "value (empty string allowed)."),
        stringParam("groupId", "target group id for create/move (optional).", { acceptsUndefined: true })
      ],
      result: snapshotResult(),
      sourceLocation: src
    },
    "customEnv/setVars": {
      service: "customEnv",
      description: "Create or replace many variables by name in one rewrite. Optional group per entry.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "entries",
          description: "name/value pairs with optional group (last duplicate name wins).",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "readonly EnvVarWrite[]",
            create: setVars$parameter$0$schema,
            jsonSchema: { type: "array", items: envVarWriteJsonSchema }
          }
        }
      ],
      result: voidResult,
      sourceLocation: src
    },
    "customEnv/setVar": {
      service: "customEnv",
      description: "Create or replace one variable by name. Optional group: new names default to default; existing keep group when omitted.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("name", "writable variable name."),
        stringParam("value", "value to store (empty string allowed)."),
        stringParam("group", "optional group id; omit to keep existing membership.", { acceptsUndefined: true })
      ],
      result: voidResult,
      sourceLocation: src
    },
    "customEnv/removeVars": {
      service: "customEnv",
      description: "Remove many variables by name from the file, Host, and OS user environment.",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "names",
          description: "writable variable names.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "readonly string[]",
            create: removeVars$parameter$0$schema,
            jsonSchema: { type: "array", items: { type: "string" } }
          }
        }
      ],
      result: {
        mode: "strict",
        typeSymbol: "number",
        create: () => import_zod.z.number(),
        description: "number of .env lines removed.",
        jsonSchema: { type: "number" }
      },
      sourceLocation: src
    },
    "customEnv/removeVar": {
      service: "customEnv",
      description: "Remove one variable by name from the file, Host, and OS user environment.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("name", "writable variable name.")
      ],
      result: {
        mode: "strict",
        typeSymbol: "boolean",
        create: () => import_zod.z.boolean(),
        description: "true when a .env line was removed.",
        jsonSchema: { type: "boolean" }
      },
      sourceLocation: src
    },
    "customEnv/deleteEntry": {
      service: "customEnv",
      description: "Delete one entry from the file, Host, and OS user environment.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "stable row id from list().")
      ],
      result: snapshotResult(),
      sourceLocation: src
    },
    "customEnv/restore": {
      service: "customEnv",
      description: "Restore Host-start original name+value for this id, or delete if added after start.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "stable row id from list().")
      ],
      result: snapshotResult(),
      sourceLocation: src
    },
    "customEnv/createGroup": {
      service: "customEnv",
      description: "Create a custom environment variable group.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("title", "non-empty display title.")
      ],
      result: groupResult("created group."),
      sourceLocation: src
    },
    "customEnv/renameGroup": {
      service: "customEnv",
      description: "Rename a custom group (not the default group).",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "group id."),
        stringParam("title", "new non-empty title.")
      ],
      result: groupResult("renamed group."),
      sourceLocation: src
    },
    "customEnv/deleteGroup": {
      service: "customEnv",
      description: "Delete a custom group; optionally move members to default or remove their variables.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "group id (not default)."),
        {
          name: "options",
          description: "moveToDefault controls whether members are kept.",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "DeleteGroupOptions",
            create: deleteGroup$parameter$1$schema,
            jsonSchema: {
              type: "object",
              properties: { moveToDefault: { type: "boolean" } },
              required: ["moveToDefault"],
              additionalProperties: false
            }
          }
        }
      ],
      result: snapshotResult(),
      sourceLocation: src
    },
    "customEnv/moveEntry": {
      service: "customEnv",
      description: "Move one row into another group.",
      invocation: { kind: "direct" },
      parameters: [
        stringParam("id", "stable row id from list()."),
        stringParam("groupId", "target group id.")
      ],
      result: snapshotResult(),
      sourceLocation: src
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
      sourceLocation: src
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
      sourceLocation: src
    }
  }
}, import_zod.z);
var typert_remote_client_default = TYPERT_REMOTE;

// src/client/EnvSettingsSection.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/group-ids.ts
var DEFAULT_GROUP_ID = "default";

// src/client/format-remote-error.ts
function isRemoteFailure(value) {
  return typeof value === "object" && value !== null && value.isDSHRemoteError === true && typeof value.code === "string";
}
function formatRemoteError(error, t) {
  if (isRemoteFailure(error)) {
    if (error.code === "custom-env/invalid-name") return t("error.invalidName");
    if (error.code === "custom-env/invalid-value") return t("error.invalidValue");
    if (error.code === "custom-env/invalid-group") return t("error.invalidGroup");
    if (error.code === "custom-env/restore-failed") return t("error.restoreFailed");
    if (error.code === "custom-env/cli-install-failed") return t("error.cliInstall");
  }
  return t("error.generic");
}

// src/client/parse-env-paste.ts
var NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u;
function parseEnvPaste(text) {
  const lastByName = /* @__PURE__ */ new Map();
  const order = [];
  for (const rawLine of text.split(/\r\n|\n|\r/u)) {
    const line = rawLine.trim();
    if (line === "") continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const name = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (!NAME_OK.test(name)) continue;
    if (!lastByName.has(name)) order.push(name);
    lastByName.set(name, value);
  }
  return order.map((name) => ({ name, value: lastByName.get(name) }));
}
function formatEnvCopy(pairs) {
  const lines = [];
  for (const pair of pairs) {
    const name = pair.name.trim();
    if (name === "") continue;
    lines.push(`${name}=${pair.value}`);
  }
  return lines.join("\n");
}

// src/client/env-row-select.ts
function isSelectionEditKey(event) {
  return event.ctrlKey || event.metaKey;
}
function rangeIds(ordered, from, to) {
  const a = ordered.indexOf(from);
  const b = ordered.indexOf(to);
  if (a < 0 || b < 0) return from === to && a >= 0 ? [from] : [];
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  return ordered.slice(start, end + 1);
}
function clearDomTextSelection() {
  const selection = window.getSelection();
  if (selection !== null && selection.rangeCount > 0) selection.removeAllRanges();
}
function hasFocusedInputTextSelection() {
  const active = document.activeElement;
  if (!(active instanceof HTMLInputElement) && !(active instanceof HTMLTextAreaElement)) return false;
  const start = active.selectionStart;
  const end = active.selectionEnd;
  return start !== null && end !== null && start !== end;
}
function selectedEnvCopyText(selectedIds, orderedIds, drafts) {
  if (selectedIds.size === 0) return "";
  const pairs = orderedIds.flatMap((id) => {
    if (!selectedIds.has(id)) return [];
    const draft = drafts[id];
    if (draft === void 0) return [];
    const name = draft.name.trim();
    if (name === "") return [];
    return [{ name, value: draft.value }];
  });
  return formatEnvCopy(pairs);
}
function rowIdFromPoint(clientX, clientY) {
  const hit = document.elementFromPoint(clientX, clientY);
  if (!(hit instanceof Element)) return void 0;
  const row = hit.closest("[data-env-row]");
  if (!(row instanceof HTMLElement)) return void 0;
  const id = row.dataset.envRow;
  return id === void 0 || id === "" ? void 0 : id;
}

// src/client/EnvSettingsSection.module.css
var css = ".EnvSettingsSection_section {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  max-width: 760px;\n  min-width: 0;\n  color: var(--dsw-alias-label-primary);\n  container-type: inline-size;\n}\n\n.EnvSettingsSection_heading {\n  margin: 0;\n  font-size: 18px;\n  font-weight: 500;\n  line-height: 1.3;\n}\n\n/* \u2014\u2014 dsh CLI: exactly two lines (label + path) \u2014\u2014 */\n.EnvSettingsSection_cli {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.EnvSettingsSection_cliHeading {\n  margin: 0;\n  font-size: 13px;\n  font-weight: 500;\n  line-height: 20px;\n  color: var(--dsw-alias-label-secondary);\n}\n\n.EnvSettingsSection_cliBody {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 28px;\n  gap: 8px;\n  align-items: center;\n  height: 28px;\n}\n\n.EnvSettingsSection_cliPath {\n  margin: 0;\n  min-width: 0;\n  font-size: 13px;\n  line-height: 28px;\n  color: var(--dsw-alias-label-tertiary);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.EnvSettingsSection_cliSlot {\n  display: flex;\n  width: 28px;\n  height: 28px;\n  align-items: center;\n  justify-content: center;\n}\n\n.EnvSettingsSection_cliSlot[data-empty='true'] {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.EnvSettingsSection_notice {\n  margin: 0;\n  font-size: 13px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.EnvSettingsSection_notice[data-tone='error'] {\n  color: var(--dsw-alias-label-danger, #c62828);\n}\n\n/* \u2014\u2014 variable rows: name | value | actions \u2014\u2014 */\n.EnvSettingsSection_header,\n.EnvSettingsSection_row {\n  display: grid;\n  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr) 116px;\n  gap: 10px;\n  align-items: center;\n  min-width: 0;\n}\n\n.EnvSettingsSection_row {\n  padding: 4px 6px;\n  margin: 0 -6px;\n  user-select: none;\n}\n\n.EnvSettingsSection_row[data-selected='true'] {\n  background: var(--dsw-alias-fill-hover, rgba(127, 127, 127, 0.1));\n}\n\n.EnvSettingsSection_row[data-composer='true'] {\n  user-select: auto;\n}\n\n.EnvSettingsSection_header {\n  padding: 0 0 2px;\n}\n\n.EnvSettingsSection_headerLabel {\n  margin: 0;\n  font-size: 12px;\n  font-weight: 500;\n  line-height: 1.3;\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.EnvSettingsSection_headerActions {\n  width: 116px;\n}\n\n/* Extremely narrow pane: value wraps under name; actions stay on the first row. */\n@container (max-width: 360px) {\n  .EnvSettingsSection_header,\n  .EnvSettingsSection_row {\n    grid-template-columns: minmax(0, 1fr) 116px;\n    align-items: start;\n    row-gap: 8px;\n  }\n\n  .EnvSettingsSection_header {\n    align-items: end;\n  }\n\n  .EnvSettingsSection_header > :nth-child(1),\n  .EnvSettingsSection_row > :nth-child(1) {\n    grid-column: 1;\n    grid-row: 1;\n  }\n\n  .EnvSettingsSection_header > :nth-child(3),\n  .EnvSettingsSection_row > :nth-child(3) {\n    grid-column: 2;\n    grid-row: 1;\n  }\n\n  .EnvSettingsSection_header > :nth-child(2),\n  .EnvSettingsSection_row > :nth-child(2) {\n    grid-column: 1 / -1;\n    grid-row: 2;\n  }\n\n  .EnvSettingsSection_actions {\n    margin-left: 0;\n  }\n}\n\n.EnvSettingsSection_field {\n  min-width: 0;\n  overflow: hidden;\n}\n\n.EnvSettingsSection_fieldInput {\n  display: flex;\n  box-sizing: border-box;\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  user-select: none;\n}\n\n.EnvSettingsSection_field:focus-within,\n.EnvSettingsSection_field:focus-within .EnvSettingsSection_fieldInput,\n.EnvSettingsSection_row[data-composer='true'] .EnvSettingsSection_fieldInput {\n  user-select: text;\n}\n\n.EnvSettingsSection_actions {\n  display: grid;\n  grid-template-columns: repeat(4, 26px);\n  gap: 2px;\n  align-items: center;\n  justify-content: end;\n  width: 116px;\n  margin-left: auto;\n  flex-shrink: 0;\n}\n\n.EnvSettingsSection_slot {\n  display: flex;\n  width: 26px;\n  height: 26px;\n  align-items: center;\n  justify-content: center;\n}\n\n.EnvSettingsSection_slot[data-empty='true'] {\n  visibility: hidden;\n  pointer-events: none;\n}\n\n.EnvSettingsSection_iconButton {\n  display: inline-flex;\n  width: 26px;\n  height: 26px;\n  margin: 0;\n  padding: 0;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  border-radius: var(--dsw-radius-sm, 6px);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n}\n\n.EnvSettingsSection_iconButton:hover:not(:disabled) {\n  background: var(--dsw-alias-fill-hover, rgba(127, 127, 127, 0.12));\n  color: var(--dsw-alias-label-primary);\n}\n\n.EnvSettingsSection_iconButton:disabled {\n  opacity: 0.45;\n  cursor: default;\n}\n\n.EnvSettingsSection_iconButtonDanger:hover:not(:disabled) {\n  color: var(--dsw-alias-label-danger, #c62828);\n}\n\n.EnvSettingsSection_iconButtonPrimary {\n  color: var(--dsw-alias-brand-primary, #247bbf);\n}\n\n.EnvSettingsSection_restartBadge {\n  display: inline-flex;\n  width: 26px;\n  height: 26px;\n  align-items: center;\n  justify-content: center;\n  color: var(--dsw-alias-label-warning, #c67c00);\n}\n\n.EnvSettingsSection_spinner {\n  animation: spin 1s linear infinite;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .EnvSettingsSection_spinner {\n    animation: none;\n  }\n}\n\n.EnvSettingsSection_groups {\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n  min-width: 0;\n}\n\n.EnvSettingsSection_group {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n}\n\n.EnvSettingsSection_group + .EnvSettingsSection_group {\n  border-top: 0.5px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.25));\n  padding-top: 14px;\n}\n\n.EnvSettingsSection_groupTitleRow {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-height: 36px;\n}\n\n.EnvSettingsSection_groupToggle {\n  display: flex;\n  flex: none;\n  align-items: center;\n  gap: 8px;\n  border: 0;\n  padding: 0;\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n\n.EnvSettingsSection_groupToggle:focus-visible {\n  outline: 2px solid var(--dsw-alias-brand-primary, #247bbf);\n  outline-offset: 2px;\n}\n\n.EnvSettingsSection_groupToggle > .EnvSettingsSection_chevron {\n  transform: rotate(-90deg);\n}\n\n.EnvSettingsSection_groupToggle[aria-expanded='true'] > .EnvSettingsSection_chevron {\n  transform: none;\n}\n\n.EnvSettingsSection_groupTitle {\n  font-size: 14px;\n  line-height: 22px;\n  font-weight: 400;\n  color: var(--dsw-alias-label-primary);\n}\n\n.EnvSettingsSection_headerEnd {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  margin-left: auto;\n}\n\n.EnvSettingsSection_groupBody {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  min-width: 0;\n}\n\n.EnvSettingsSection_modalField {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin-top: 8px;\n}\n\n.EnvSettingsSection_modalCheck {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-top: 12px;\n  font-size: 13px;\n  line-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n}\n";
if (typeof document !== "undefined" && !document.getElementById("dsh-custom-env-css")) {
  const style = document.createElement("style");
  style.id = "dsh-custom-env-css";
  style.textContent = css;
  document.head.appendChild(style);
}
var EnvSettingsSection_default = { "section": "EnvSettingsSection_section", "heading": "EnvSettingsSection_heading", "cli": "EnvSettingsSection_cli", "cliHeading": "EnvSettingsSection_cliHeading", "cliBody": "EnvSettingsSection_cliBody", "cliPath": "EnvSettingsSection_cliPath", "cliSlot": "EnvSettingsSection_cliSlot", "notice": "EnvSettingsSection_notice", "header": "EnvSettingsSection_header", "row": "EnvSettingsSection_row", "headerLabel": "EnvSettingsSection_headerLabel", "headerActions": "EnvSettingsSection_headerActions", "actions": "EnvSettingsSection_actions", "field": "EnvSettingsSection_field", "fieldInput": "EnvSettingsSection_fieldInput", "slot": "EnvSettingsSection_slot", "iconButton": "EnvSettingsSection_iconButton", "iconButtonDanger": "EnvSettingsSection_iconButtonDanger", "iconButtonPrimary": "EnvSettingsSection_iconButtonPrimary", "restartBadge": "EnvSettingsSection_restartBadge", "spinner": "EnvSettingsSection_spinner", "groups": "EnvSettingsSection_groups", "group": "EnvSettingsSection_group", "groupTitleRow": "EnvSettingsSection_groupTitleRow", "groupToggle": "EnvSettingsSection_groupToggle", "chevron": "EnvSettingsSection_chevron", "groupTitle": "EnvSettingsSection_groupTitle", "headerEnd": "EnvSettingsSection_headerEnd", "groupBody": "EnvSettingsSection_groupBody", "modalField": "EnvSettingsSection_modalField", "modalCheck": "EnvSettingsSection_modalCheck" };

// src/client/EnvSettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var NAME_OK2 = /^[A-Za-z_][A-Za-z0-9_]*$/u;
var PENDING_PREFIX = "pending:";
var COMPOSER_PREFIX = "composer:";
function isPendingId(id) {
  return id.startsWith(PENDING_PREFIX);
}
function composerId(groupId) {
  return `${COMPOSER_PREFIX}${groupId}`;
}
function isComposerId(id) {
  return id.startsWith(COMPOSER_PREFIX);
}
function rowsByGroup(groups, entries, pendingOrder, pendingGroup) {
  const saved = new Map(groups.map((group) => [group.id, []]));
  const pending = new Map(groups.map((group) => [group.id, []]));
  for (const entry of entries) {
    (saved.get(saved.has(entry.groupId) ? entry.groupId : DEFAULT_GROUP_ID) ?? saved.get(DEFAULT_GROUP_ID)).push(entry);
  }
  for (const id of pendingOrder) {
    const groupId = pendingGroup[id] ?? DEFAULT_GROUP_ID;
    (pending.get(pending.has(groupId) ? groupId : DEFAULT_GROUP_ID) ?? pending.get(DEFAULT_GROUP_ID)).push(id);
  }
  return { saved, pending };
}
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
  moveItems,
  onConfirm,
  onCancel,
  onRestore,
  onRemove,
  onMove
}) {
  const [moveOpen, setMoveOpen] = (0, import_react.useState)(false);
  const showMove = moveItems !== void 0 && moveItems.length > 0 && onMove !== void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.actions, role: "group", "aria-label": t("field.actions"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !dirty && !pending, children: dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: loading ? t("panel.loading") : t("action.confirm"), primary: true, disabled: busy || !canConfirm, onClick: onConfirm, children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLoadingOutlineRegular, { className: EnvSettingsSection_default.spinner, size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCheckOutlineRegular, { size: 14 }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tooltip, { portal: true, label: t("status.restartRequired"), side: "top", delayMs: 400, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: EnvSettingsSection_default.restartBadge, role: "img", "aria-label": t("status.restartRequired"), title: t("status.restartRequired"), children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconWarningOutlineRegular, { size: 14 }) }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !dirty && !pending, children: dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.cancel"), disabled: busy, onClick: onCancel, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 14 }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.restore"), disabled: busy, onClick: onRestore, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 14 }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, { empty: !showMove, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Menu,
      {
        open: moveOpen,
        onClose: () => {
          setMoveOpen(false);
        },
        items: (moveItems ?? []).map((item) => ({ id: item.id, label: item.label })),
        onSelect: (groupId) => {
          setMoveOpen(false);
          onMove?.(groupId);
        },
        align: "end",
        portal: true,
        anchor: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconAction, { label: t("action.moveGroup"), disabled: busy, onClick: () => {
          setMoveOpen((value) => !value);
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconFolderOpenOutlineRegular, { size: 14 }) })
      }
    ) }),
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
      onMouseDown: (event) => {
        if (!props.rowSelectGestures) {
          event.stopPropagation();
          return;
        }
        if (isSelectionEditKey(event)) event.preventDefault();
      },
      onChange: (event) => {
        props.onChange(event.target.value);
      },
      onPaste: props.onPaste
    }
  ) });
}
function EnvSettingsSection({
  t,
  load,
  upsert,
  remove,
  restore,
  moveEntry,
  createGroup,
  renameGroup,
  deleteGroup,
  cliStatus,
  cliInstall
}) {
  const [snapshot, setSnapshot] = (0, import_react.useState)();
  const [cli, setCli] = (0, import_react.useState)();
  const [drafts, setDrafts] = (0, import_react.useState)({});
  const [pendingOrder, setPendingOrder] = (0, import_react.useState)([]);
  const [pendingGroup, setPendingGroup] = (0, import_react.useState)({});
  const [openGroups, setOpenGroups] = (0, import_react.useState)({ [DEFAULT_GROUP_ID]: true });
  const [busyTarget, setBusyTarget] = (0, import_react.useState)();
  const [error, setError] = (0, import_react.useState)();
  const [nameError, setNameError] = (0, import_react.useState)(false);
  const [pendingRemove, setPendingRemove] = (0, import_react.useState)();
  const [groupModal, setGroupModal] = (0, import_react.useState)();
  const [groupTitleDraft, setGroupTitleDraft] = (0, import_react.useState)("");
  const [selectedIds, setSelectedIds] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
  const pendingSeq = (0, import_react.useRef)(0);
  const draftsRef = (0, import_react.useRef)(drafts);
  draftsRef.current = drafts;
  const pendingOrderRef = (0, import_react.useRef)(pendingOrder);
  pendingOrderRef.current = pendingOrder;
  const pendingGroupRef = (0, import_react.useRef)(pendingGroup);
  pendingGroupRef.current = pendingGroup;
  const selectedRef = (0, import_react.useRef)(selectedIds);
  selectedRef.current = selectedIds;
  const anchorIdRef = (0, import_react.useRef)(void 0);
  const dragModeRef = (0, import_react.useRef)(void 0);
  const dragVisitedRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
  const dragPendingCrossRef = (0, import_react.useRef)(false);
  const pendingRemoveRef = (0, import_react.useRef)(pendingRemove);
  pendingRemoveRef.current = pendingRemove;
  const groupModalRef = (0, import_react.useRef)(groupModal);
  groupModalRef.current = groupModal;
  const busy = busyTarget !== void 0;
  const groups = snapshot?.groups ?? [{ id: DEFAULT_GROUP_ID, title: t("group.defaultTitle") }];
  const entries = snapshot?.entries ?? [];
  const taken = new Set(entries.map((entry) => entry.name));
  const grouped = rowsByGroup(groups, entries, pendingOrder, pendingGroup);
  const selectableOrder = groups.flatMap((group) => [
    ...(grouped.saved.get(group.id) ?? []).map((entry) => entry.id),
    ...grouped.pending.get(group.id) ?? []
  ]);
  const selectableOrderRef = (0, import_react.useRef)(selectableOrder);
  selectableOrderRef.current = selectableOrder;
  const groupLabel = (group) => group.id === DEFAULT_GROUP_ID ? t("group.defaultTitle") : group.title;
  const keepTransientDrafts = (current, dropId) => {
    const kept = {};
    for (const [id, draft] of Object.entries(current)) {
      if (isComposerId(id)) kept[id] = draft;
      else if (isPendingId(id) && id !== dropId) kept[id] = draft;
    }
    return kept;
  };
  const emptyComposers = (nextGroups, current) => Object.fromEntries(nextGroups.map((group) => {
    const id = composerId(group.id);
    return [id, current[id] ?? { name: "", value: "" }];
  }));
  const forgetPendingId = (id) => {
    setPendingOrder((order) => order.filter((item) => item !== id));
    setPendingGroup((previous) => {
      if (previous[id] === void 0) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setSelectedIds((previous) => {
      if (!previous.has(id)) return previous;
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
    if (anchorIdRef.current === id) anchorIdRef.current = void 0;
  };
  const applySnapshot = (next, dropPendingId) => {
    setSnapshot(next);
    setOpenGroups((previous) => {
      const merged = { ...previous };
      for (const group of next.groups) {
        if (merged[group.id] === void 0) merged[group.id] = group.id === DEFAULT_GROUP_ID;
      }
      return merged;
    });
    if (dropPendingId !== void 0) forgetPendingId(dropPendingId);
    setDrafts((current) => ({
      ...emptyComposers(next.groups, current),
      ...keepTransientDrafts(current, dropPendingId),
      ...Object.fromEntries(next.entries.map((entry) => [entry.id, { name: entry.name, value: entry.value }]))
    }));
  };
  const setDraft = (id, patch) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: { name: patch.name ?? previous[id]?.name ?? "", value: patch.value ?? previous[id]?.value ?? "" }
    }));
  };
  const dropPending = (id) => {
    forgetPendingId(id);
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedIds(/* @__PURE__ */ new Set());
    anchorIdRef.current = void 0;
    clearDomTextSelection();
  };
  const pruneSelection = (allowed) => {
    setSelectedIds((previous) => {
      let changed = false;
      const next = /* @__PURE__ */ new Set();
      for (const id of previous) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : previous;
    });
    if (anchorIdRef.current !== void 0 && !allowed.has(anchorIdRef.current)) {
      anchorIdRef.current = void 0;
    }
  };
  const run = async (target, action, dropPendingId) => {
    if (busyTarget !== void 0) return;
    setBusyTarget(target);
    setError(void 0);
    try {
      applySnapshot(await action(), dropPendingId);
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
      setPendingOrder([]);
      setPendingGroup({});
      clearSelection();
      const next = await load();
      setSnapshot(next);
      setOpenGroups(Object.fromEntries(next.groups.map((group) => [group.id, group.id === DEFAULT_GROUP_ID])));
      setDrafts({
        ...emptyComposers(next.groups, {}),
        ...Object.fromEntries(next.entries.map((entry) => [entry.id, { name: entry.name, value: entry.value }]))
      });
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
  (0, import_react.useEffect)(() => {
    pruneSelection(new Set(selectableOrder));
  }, [selectableOrder.join("\0")]);
  const stopEditingGesture = () => {
    clearDomTextSelection();
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && active.closest(`.${EnvSettingsSection_default.groups}`) !== null) active.blur();
  };
  const applyDragOverRow = (id) => {
    if (dragModeRef.current === void 0) return;
    if (dragModeRef.current === "toggle") {
      if (dragVisitedRef.current.has(id)) return;
      stopEditingGesture();
      dragVisitedRef.current.add(id);
      setSelectedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    if (dragPendingCrossRef.current && id === anchorIdRef.current) return;
    if (dragPendingCrossRef.current || id !== anchorIdRef.current) {
      dragPendingCrossRef.current = false;
      stopEditingGesture();
    }
    dragVisitedRef.current.add(id);
    setSelectedIds(new Set(rangeIds(selectableOrderRef.current, anchorIdRef.current ?? id, id)));
  };
  (0, import_react.useEffect)(() => {
    if (selectedIds.size > 0) clearDomTextSelection();
  }, [selectedIds]);
  (0, import_react.useEffect)(() => {
    const endDrag = () => {
      dragModeRef.current = void 0;
      dragVisitedRef.current = /* @__PURE__ */ new Set();
      dragPendingCrossRef.current = false;
    };
    const onMove = (event) => {
      if (event.buttons !== 1 || dragModeRef.current === void 0) return;
      const id = rowIdFromPoint(event.clientX, event.clientY);
      if (id !== void 0) applyDragOverRow(id);
    };
    const onPointerDown = (event) => {
      if (selectedRef.current.size === 0 || pendingRemoveRef.current !== void 0 || groupModalRef.current !== void 0) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-env-row]") !== null) return;
      clearSelection();
    };
    const copyText = () => selectedEnvCopyText(selectedRef.current, selectableOrderRef.current, draftsRef.current);
    const onKeyDown = (event) => {
      if (selectedRef.current.size === 0) return;
      if (event.key !== "c" && event.key !== "C" || !isSelectionEditKey(event) || event.altKey || event.shiftKey) return;
      if (hasFocusedInputTextSelection()) return;
      const text = copyText();
      if (text === "") return;
      event.preventDefault();
      void navigator.clipboard.writeText(text);
    };
    const onCopy = (event) => {
      if (selectedRef.current.size === 0 || hasFocusedInputTextSelection()) return;
      const text = copyText();
      if (text === "") return;
      event.preventDefault();
      event.clipboardData?.setData("text/plain", text);
    };
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("copy", onCopy, true);
    return () => {
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onCopy, true);
    };
  }, []);
  const saveExisting = (id, entryName) => {
    const draft = drafts[id] ?? { name: "", value: "" };
    const name = draft.name.trim();
    const takenByOther = name !== entryName && taken.has(name);
    if (!NAME_OK2.test(name) || takenByOther) {
      setNameError(true);
      return;
    }
    if (draft.value === "") return;
    setNameError(false);
    void run(`row:${id}`, () => upsert(id, name, draft.value));
  };
  const savePending = (id) => {
    const draft = drafts[id] ?? { name: "", value: "" };
    const name = draft.name.trim();
    if (!NAME_OK2.test(name) || taken.has(name)) {
      setNameError(true);
      return;
    }
    if (draft.value === "") return;
    setNameError(false);
    const groupId = pendingGroup[id] ?? DEFAULT_GROUP_ID;
    void run(`pending:${id}`, () => upsert("", name, draft.value, groupId), id);
  };
  const typeIntoComposer = (groupId, patch, focus) => {
    setNameError(false);
    const key = composerId(groupId);
    const base = draftsRef.current[key] ?? { name: "", value: "" };
    const next = { name: patch.name ?? base.name, value: patch.value ?? base.value };
    const id = `${PENDING_PREFIX}${++pendingSeq.current}`;
    setDrafts((previous) => ({
      ...previous,
      [id]: next,
      [key]: { name: "", value: "" }
    }));
    setPendingOrder((order) => [...order, id]);
    setPendingGroup((previous) => ({ ...previous, [id]: groupId }));
    queueMicrotask(() => {
      document.getElementById(`env-${focus}-${id}`)?.focus();
    });
  };
  const appendPendingPairs = (groupId, pairs) => {
    if (pairs.length === 0) return;
    setNameError(false);
    const previous = draftsRef.current;
    const order = pendingOrderRef.current;
    const groupsByPending = pendingGroupRef.current;
    const nextDrafts = { ...previous, [composerId(groupId)]: { name: "", value: "" } };
    const existingPendingByName = /* @__PURE__ */ new Map();
    for (const id of order) {
      const draft = previous[id];
      if (draft !== void 0) existingPendingByName.set(draft.name.trim(), id);
    }
    const savedByName = new Map(entries.map((entry) => [entry.name, entry.id]));
    const added = [];
    const dropPendingIds = /* @__PURE__ */ new Set();
    const nextPendingGroup = { ...groupsByPending };
    for (const pair of pairs) {
      const savedId = savedByName.get(pair.name);
      if (savedId !== void 0) {
        nextDrafts[savedId] = { name: pair.name, value: pair.value };
        const pendingDup = existingPendingByName.get(pair.name);
        if (pendingDup !== void 0) {
          delete nextDrafts[pendingDup];
          dropPendingIds.add(pendingDup);
          delete nextPendingGroup[pendingDup];
          existingPendingByName.delete(pair.name);
        }
        continue;
      }
      const reuse = existingPendingByName.get(pair.name);
      if (reuse !== void 0) {
        nextDrafts[reuse] = { name: pair.name, value: pair.value };
        continue;
      }
      const id = `${PENDING_PREFIX}${++pendingSeq.current}`;
      nextDrafts[id] = { name: pair.name, value: pair.value };
      existingPendingByName.set(pair.name, id);
      nextPendingGroup[id] = groupId;
      added.push(id);
    }
    setDrafts(nextDrafts);
    setPendingGroup(nextPendingGroup);
    if (added.length > 0 || dropPendingIds.size > 0) {
      setPendingOrder([...order.filter((id) => !dropPendingIds.has(id)), ...added]);
    }
  };
  const onComposerPaste = (groupId, event) => {
    const text = event.clipboardData.getData("text");
    const pairs = parseEnvPaste(text);
    if (pairs.length === 0) return;
    event.preventDefault();
    appendPendingPairs(groupId, pairs);
  };
  const onRowMouseDown = (id, event) => {
    if (event.button !== 0) return;
    const target = event.target;
    const onInput = target?.closest("input") !== null;
    const onControl = target?.closest('button, a, [role="button"]') !== null;
    if (isSelectionEditKey(event)) {
      event.preventDefault();
      clearDomTextSelection();
      dragPendingCrossRef.current = false;
      if (event.shiftKey && anchorIdRef.current !== void 0) {
        const spanned = rangeIds(selectableOrder, anchorIdRef.current, id);
        setSelectedIds(new Set(spanned));
        dragModeRef.current = "range";
        dragVisitedRef.current = new Set(spanned);
        return;
      }
      setSelectedIds((previous) => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      anchorIdRef.current = id;
      dragModeRef.current = "toggle";
      dragVisitedRef.current = /* @__PURE__ */ new Set([id]);
      return;
    }
    if (!onInput && !onControl) event.preventDefault();
    anchorIdRef.current = id;
    dragModeRef.current = "range";
    dragVisitedRef.current = /* @__PURE__ */ new Set([id]);
    dragPendingCrossRef.current = true;
  };
  const submitGroupModal = () => {
    if (groupModal === void 0 || busyTarget !== void 0) return;
    if (groupModal.kind === "create" || groupModal.kind === "rename") {
      const title = groupTitleDraft.trim();
      if (title === "") return;
      setBusyTarget("group");
      setError(void 0);
      void (async () => {
        try {
          if (groupModal.kind === "create") {
            const group = await createGroup(title);
            const next = await load();
            applySnapshot(next);
            setOpenGroups((previous) => ({ ...previous, [group.id]: true }));
          } else {
            await renameGroup(groupModal.id, title);
            applySnapshot(await load());
          }
          setGroupModal(void 0);
        } catch (err) {
          setError(formatRemoteError(err, t));
        } finally {
          setBusyTarget(void 0);
        }
      })();
      return;
    }
    setBusyTarget("group");
    setError(void 0);
    void (async () => {
      try {
        applySnapshot(await deleteGroup(groupModal.id, groupModal.moveToDefault));
        setGroupModal(void 0);
      } catch (err) {
        setError(formatRemoteError(err, t));
      } finally {
        setBusyTarget(void 0);
      }
    })();
  };
  const cliInstalling = busyTarget === "cli";
  const cliBooting = busyTarget === "boot" || cli === void 0;
  const showCliAction = cli?.canInstall === true || cliInstalling;
  const notice = error ?? (nameError ? t("error.invalidName") : void 0) ?? (cli?.reason === "could-not-resolve-expected-cli" ? t("error.cliUnresolved") : void 0) ?? (cli?.reason === "unsupported-platform" ? t("error.cliUnsupported") : void 0);
  const moveTargets = (currentGroupId) => groups.filter((group) => group.id !== currentGroupId).map((group) => ({ id: group.id, label: groupLabel(group) }));
  const renderRow = (entry) => {
    const draft = drafts[entry.id] ?? { name: entry.name, value: entry.value };
    const dirty = draft.name !== entry.name || draft.value !== entry.value;
    const pendingKind = entry.kind === "added" || entry.kind === "modified";
    const loading = busyTarget === `row:${entry.id}`;
    const nextName = draft.name.trim();
    const canConfirm = NAME_OK2.test(nextName) && draft.value !== "" && !(nextName !== entry.name && taken.has(nextName));
    const selected = selectedIds.has(entry.id);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: EnvSettingsSection_default.row,
        "data-env-row": entry.id,
        "data-selected": selected ? "true" : "false",
        "aria-selected": selected,
        onMouseDown: (event) => {
          onRowMouseDown(entry.id, event);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Field,
            {
              id: `env-name-${entry.id}`,
              value: draft.name,
              disabled: busy,
              title: draft.name,
              invalid: nameError && dirty,
              label: t("field.name"),
              rowSelectGestures: true,
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
              rowSelectGestures: true,
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
              pending: pendingKind && !dirty ? true : false,
              moveItems: moveTargets(entry.groupId),
              onConfirm: () => {
                saveExisting(entry.id, entry.name);
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
              },
              onMove: (groupId) => {
                void run(`row:${entry.id}`, () => moveEntry(entry.id, groupId));
              }
            }
          )
        ]
      },
      entry.id
    );
  };
  const renderPending = (id, groupId) => {
    const draft = drafts[id] ?? { name: "", value: "" };
    const loading = busyTarget === `pending:${id}`;
    const nextName = draft.name.trim();
    const canConfirm = NAME_OK2.test(nextName) && draft.value !== "" && !taken.has(nextName);
    const selected = selectedIds.has(id);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        className: EnvSettingsSection_default.row,
        "data-env-row": id,
        "data-selected": selected ? "true" : "false",
        "aria-selected": selected,
        onMouseDown: (event) => {
          onRowMouseDown(id, event);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Field,
            {
              id: `env-name-${id}`,
              value: draft.name,
              disabled: busy,
              title: draft.name,
              invalid: nameError,
              label: t("field.name"),
              rowSelectGestures: true,
              onChange: (name) => {
                setNameError(false);
                setDraft(id, { name });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            Field,
            {
              id: `env-value-${id}`,
              value: draft.value,
              disabled: busy,
              title: draft.value,
              label: t("field.value"),
              rowSelectGestures: true,
              onChange: (value) => {
                setDraft(id, { value });
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            RowActions,
            {
              t,
              busy,
              loading,
              dirty: true,
              canConfirm,
              showRemove: false,
              onConfirm: () => {
                savePending(id);
              },
              onCancel: () => {
                setNameError(false);
                dropPending(id);
              },
              onRestore: () => void 0,
              onRemove: () => void 0
            }
          )
        ]
      },
      id
    );
  };
  const renderComposer = (groupId) => {
    const key = composerId(groupId);
    const composer = drafts[key] ?? { name: "", value: "" };
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.row, "data-composer": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Field,
        {
          id: `env-new-name-${groupId}`,
          value: composer.name,
          disabled: busy,
          placeholder: t("field.namePlaceholder"),
          title: composer.name || t("field.namePlaceholder"),
          label: t("field.name"),
          onChange: (name) => {
            typeIntoComposer(groupId, { name }, "name");
          },
          onPaste: (event) => {
            onComposerPaste(groupId, event);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        Field,
        {
          id: `env-new-value-${groupId}`,
          value: composer.value,
          disabled: busy,
          placeholder: t("field.valuePlaceholder"),
          title: composer.value || t("field.valuePlaceholder"),
          label: t("field.value"),
          onChange: (value) => {
            typeIntoComposer(groupId, { value }, "value");
          },
          onPaste: (event) => {
            onComposerPaste(groupId, event);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.actions, "aria-hidden": "true" })
    ] });
  };
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
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.groups, children: groups.map((group) => {
      const expanded = openGroups[group.id] === true;
      const groupEntries = grouped.saved.get(group.id) ?? [];
      const groupPending = grouped.pending.get(group.id) ?? [];
      const isDefault = group.id === DEFAULT_GROUP_ID;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: EnvSettingsSection_default.group, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.groupTitleRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: EnvSettingsSection_default.groupToggle,
              "aria-expanded": expanded,
              onClick: () => {
                setOpenGroups((previous) => ({ ...previous, [group.id]: !expanded }));
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { className: EnvSettingsSection_default.chevron, size: 12, "aria-hidden": "true" }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: EnvSettingsSection_default.groupTitle, children: groupLabel(group) })
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.headerEnd, children: isDefault ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            IconAction,
            {
              label: t("action.createGroup"),
              disabled: busy,
              onClick: () => {
                setGroupTitleDraft("");
                setGroupModal({ kind: "create" });
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconPlusOutlineRegular, { size: 14 })
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              IconAction,
              {
                label: t("action.renameGroup"),
                disabled: busy,
                onClick: () => {
                  setGroupTitleDraft(group.title);
                  setGroupModal({ kind: "rename", id: group.id, title: group.title });
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconEditOutlineRegular, { size: 14 })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              IconAction,
              {
                label: t("action.deleteGroup"),
                danger: true,
                disabled: busy,
                onClick: () => {
                  setGroupModal({
                    kind: "delete",
                    id: group.id,
                    title: group.title,
                    moveToDefault: true
                  });
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconTrashOutlineRegular, { size: 14 })
              }
            )
          ] }) })
        ] }),
        expanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.groupBody, children: [
          isDefault ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: EnvSettingsSection_default.header, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.headerLabel, children: t("field.name") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: EnvSettingsSection_default.headerLabel, children: t("field.value") }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.headerActions, "aria-hidden": "true" })
          ] }) : null,
          groupEntries.map((entry) => renderRow(entry)),
          groupPending.map((id) => renderPending(id, group.id)),
          renderComposer(group.id)
        ] }) : null
      ] }, group.id);
    }) }),
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
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: groupModal !== void 0,
        onClose: () => {
          if (!busy) setGroupModal(void 0);
        },
        title: groupModal?.kind === "create" ? t("action.createGroup") : groupModal?.kind === "rename" ? t("action.renameGroup") : t("action.deleteGroupTitle"),
        closeLabel: t("action.close"),
        description: groupModal?.kind === "delete" ? t("action.deleteGroupConfirm", { title: groupModal.title }) : void 0,
        footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: () => {
            setGroupModal(void 0);
          }, children: t("action.cancel") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              variant: "primary",
              disabled: busy || (groupModal?.kind === "create" || groupModal?.kind === "rename") && groupTitleDraft.trim() === "",
              onClick: () => {
                submitGroupModal();
              },
              children: groupModal?.kind === "delete" ? t("action.deleteGroup") : t("action.confirm")
            }
          )
        ] }),
        children: [
          groupModal?.kind === "create" || groupModal?.kind === "rename" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: EnvSettingsSection_default.modalField, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Input,
            {
              value: groupTitleDraft,
              placeholder: t("action.groupTitlePlaceholder"),
              "aria-label": t("action.groupTitle"),
              disabled: busy,
              onChange: (event) => {
                setGroupTitleDraft(event.target.value);
              }
            }
          ) }) : null,
          groupModal?.kind === "delete" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Checkbox,
            {
              className: EnvSettingsSection_default.modalCheck,
              checked: groupModal.moveToDefault,
              disabled: busy,
              label: t("action.deleteGroupMove"),
              onChange: (checked) => {
                setGroupModal({ ...groupModal, moveToDefault: checked });
              }
            }
          ) : null
        ]
      }
    )
  ] });
}

// src/client/locales.ts
var NS = "settings.env";
var zh = {
  "panel.nav": "\u73AF\u5883\u53D8\u91CF",
  "panel.title": "\u73AF\u5883\u53D8\u91CF",
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
  "action.moveGroup": "\u4FEE\u6539\u5206\u7EC4",
  "action.createGroup": "\u65B0\u5EFA\u5206\u7EC4",
  "action.renameGroup": "\u91CD\u547D\u540D\u5206\u7EC4",
  "action.deleteGroup": "\u5220\u9664\u5206\u7EC4",
  "action.deleteGroupTitle": "\u5220\u9664\u5206\u7EC4",
  "action.deleteGroupConfirm": "\u5220\u9664\u5206\u7EC4\u300C{title}\u300D\uFF1F",
  "action.deleteGroupMove": "\u53D8\u91CF\u79FB\u5165\u9ED8\u8BA4\u5206\u7EC4",
  "action.groupTitle": "\u5206\u7EC4\u540D\u79F0",
  "action.groupTitlePlaceholder": "\u5206\u7EC4\u540D\u79F0",
  "group.defaultTitle": "\u9ED8\u8BA4\u5206\u7EC4",
  "status.restartRequired": "\u9700\u91CD\u542F\u5BA2\u6237\u7AEF",
  "cli.title": "dsh",
  "cli.activeMissing": "\u672A\u627E\u5230",
  "cli.install": "\u5B89\u88C5",
  "cli.macConflict": "\u5C06\u66FF\u6362 /usr/local/bin/dsh",
  "error.generic": "\u66F4\u65B0\u5931\u8D25",
  "error.invalidName": "\u540D\u79F0\u65E0\u6548",
  "error.invalidValue": "\u503C\u65E0\u6548",
  "error.invalidGroup": "\u5206\u7EC4\u65E0\u6548",
  "error.restoreFailed": "\u6062\u590D\u5931\u8D25",
  "error.cliInstall": "\u5B89\u88C5\u5931\u8D25",
  "error.cliUnresolved": "\u65E0\u6CD5\u5B89\u88C5",
  "error.cliUnsupported": "\u4EC5 Windows / macOS"
};
var en = {
  "panel.nav": "Environment",
  "panel.title": "Environment",
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
  "action.moveGroup": "Move to group",
  "action.createGroup": "New group",
  "action.renameGroup": "Rename group",
  "action.deleteGroup": "Delete group",
  "action.deleteGroupTitle": "Delete group",
  "action.deleteGroupConfirm": 'Delete group "{title}"?',
  "action.deleteGroupMove": "Move variables into Default",
  "action.groupTitle": "Group name",
  "action.groupTitlePlaceholder": "Group name",
  "group.defaultTitle": "Default",
  "status.restartRequired": "Restart the client",
  "cli.title": "dsh",
  "cli.activeMissing": "Not found",
  "cli.install": "Install",
  "cli.macConflict": "Replaces /usr/local/bin/dsh",
  "error.generic": "Update failed",
  "error.invalidName": "Invalid name",
  "error.invalidValue": "Invalid value",
  "error.invalidGroup": "Invalid group",
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
      upsert: async (id, name, value, groupId) => call(await ctx.remote.customEnv.upsert(id, name, value, groupId)),
      remove: async (id) => call(await ctx.remote.customEnv.deleteEntry(id)),
      restore: async (id) => call(await ctx.remote.customEnv.restore(id)),
      moveEntry: async (id, groupId) => call(await ctx.remote.customEnv.moveEntry(id, groupId)),
      createGroup: async (title) => call(await ctx.remote.customEnv.createGroup(title)),
      renameGroup: async (id, title) => call(await ctx.remote.customEnv.renameGroup(id, title)),
      deleteGroup: async (id, moveToDefault) => call(await ctx.remote.customEnv.deleteGroup(id, { moveToDefault })),
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
