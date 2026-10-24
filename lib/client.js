window.__ModuleLoader__.load({
	id: "dsh-custom-env",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let zod = require("zod");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region ../../typert/protocol/lib/types/remote-info.js
		/** Lazy assembly of generated Remote definitions using caller-supplied Zod; no runtime imports. */
		/**
		* Retain one generated definition per endpoint without constructing parsers or projections.
		* The class instance builds its shared descriptor/method index on first access;
		* input schemas and JSON Schema projections are cached only when requested.
		* @param spec - compiler-produced method facts and Zod factories.
		* @param zod - the generated artifact's Zod runtime for named-input parsers.
		* @returns a lazy, mountable info instance with no registration or transport effects.
		*/
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
				if (this.index !== void 0) return this.index;
				const zod = this.zod;
				const descriptors = [];
				const methods = Object.create(null);
				for (const [endpoint, definition] of Object.entries(this.spec.methods)) {
					const separator = endpoint.indexOf("/");
					const namespace = endpoint.slice(0, separator);
					const method = endpoint.slice(separator + 1);
					const parameters = definition.parameters.map((parameter) => ({
						...parameter,
						wire: parameter.wire ?? parameter.name
					}));
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
						methods[endpoint] = Object.assign(descriptor, {
							input(options) {
								const strict = options?.strict === true;
								return inputs[strict ? 1 : 0] ??= new NamedInput(parameters, strict, zod);
							},
							invoke(remote, input, signal) {
								const named = input;
								const values = parameters.map((parameter) => named[parameter.wire]);
								if (definition.cancellation !== void 0) values.push(signal);
								const receiver = Reflect.get(remote, namespace);
								return Reflect.get(receiver, method).apply(receiver, values);
							}
						});
					}
					descriptors.push(descriptor);
				}
				return this.index = {
					descriptors,
					methods
				};
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
				if (this.projection !== void 0) return this.projection;
				const unavailable = this.parameters.find((parameter) => this.codec(parameter).jsonSchema === void 0);
				if (unavailable !== void 0) return this.projection = { jsonSchemaError: this.codec(unavailable).jsonSchemaError ?? `No JSON Schema for parameter ${unavailable.wire}` };
				return this.projection = { jsonSchema: {
					type: "object",
					properties: Object.fromEntries(this.parameters.map((parameter) => [parameter.wire, {
						...this.codec(parameter).jsonSchema,
						...parameter.description === void 0 ? {} : { description: parameter.description }
					}])),
					required: this.parameters.filter((parameter) => !optional(parameter)).map((parameter) => parameter.wire),
					additionalProperties: false
				} };
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
					this.projection = { value: schema === void 0 ? void 0 : {
						...schema,
						description: this.spec.description
					} };
				}
				return this.projection.value;
			}
		};
		//#endregion
		//#region lib/typert.remote-client.js
		let list$result$schema$value;
		const list$result$schema = () => list$result$schema$value ??= zod.z.object({
			path: zod.z.string().readonly(),
			exists: zod.z.boolean().readonly(),
			entries: zod.z.array(zod.z.object({
				name: zod.z.string().readonly(),
				value: zod.z.string().readonly()
			}).readonly()).readonly()
		});
		let upsert$parameter$0$schema$value;
		const upsert$parameter$0$schema = () => upsert$parameter$0$schema$value ??= zod.z.string();
		let upsert$parameter$1$schema$value;
		const upsert$parameter$1$schema = () => upsert$parameter$1$schema$value ??= zod.z.string();
		let remove$parameter$0$schema$value;
		const remove$parameter$0$schema = () => remove$parameter$0$schema$value ??= zod.z.string();
		const TYPERT_REMOTE = createTypertRemoteInfo({
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
						jsonSchema: {
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
											value: { type: "string" }
										},
										required: ["name", "value"],
										additionalProperties: true
									}
								}
							},
							required: [
								"path",
								"exists",
								"entries"
							],
							additionalProperties: true
						}
					},
					sourceLocation: {
						file: "packages/community/dsh-custom-env/src/index.ts",
						line: 1,
						column: 1
					}
				},
				"customEnv/upsert": {
					service: "customEnv",
					description: "Create or replace one entry, syncing Host and OS user environment.",
					invocation: { kind: "direct" },
					parameters: [{
						name: "name",
						description: "writable variable name.",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "string",
							create: upsert$parameter$0$schema,
							jsonSchema: { type: "string" }
						}
					}, {
						name: "value",
						description: "non-empty value.",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "string",
							create: upsert$parameter$1$schema,
							jsonSchema: { type: "string" }
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-custom-env/types#EnvSnapshot",
						create: list$result$schema,
						description: "updated snapshot.",
						jsonSchema: {
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
											value: { type: "string" }
										},
										required: ["name", "value"],
										additionalProperties: true
									}
								}
							},
							required: [
								"path",
								"exists",
								"entries"
							],
							additionalProperties: true
						}
					},
					sourceLocation: {
						file: "packages/community/dsh-custom-env/src/index.ts",
						line: 1,
						column: 1
					}
				},
				"customEnv/remove": {
					service: "customEnv",
					description: "Delete one entry from the file, Host, and OS user environment.",
					invocation: { kind: "direct" },
					parameters: [{
						name: "name",
						description: "writable variable name.",
						source: "json",
						codec: {
							mode: "strict",
							typeSymbol: "string",
							create: remove$parameter$0$schema,
							jsonSchema: { type: "string" }
						}
					}],
					result: {
						mode: "strict",
						typeSymbol: "dsh-custom-env/types#EnvSnapshot",
						create: list$result$schema,
						description: "updated snapshot.",
						jsonSchema: {
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
											value: { type: "string" }
										},
										required: ["name", "value"],
										additionalProperties: true
									}
								}
							},
							required: [
								"path",
								"exists",
								"entries"
							],
							additionalProperties: true
						}
					},
					sourceLocation: {
						file: "packages/community/dsh-custom-env/src/index.ts",
						line: 1,
						column: 1
					}
				}
			}
		}, zod.z);
		//#endregion
		//#region \0dsh-css:F:\data\dev\ai\lianchuan\vertax-new\work\vertax-work\packages\community\dsh-custom-env\src\client\EnvSettingsSection.module.css.mjs
		const css = ".Esk04W_section{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.Esk04W_heading{margin:0;font-size:18px;font-weight:600}.Esk04W_intro,.Esk04W_path,.Esk04W_hint,.Esk04W_empty,.Esk04W_status{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px}.Esk04W_status[data-tone=error]{color:var(--dsw-alias-label-danger,#c62828)}.Esk04W_list{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.Esk04W_row{grid-template-columns:minmax(120px,1fr) minmax(160px,2fr) auto;align-items:center;gap:8px;display:grid}.Esk04W_actions{flex-wrap:wrap;gap:8px;display:flex}.Esk04W_add{grid-template-columns:minmax(120px,1fr) minmax(160px,2fr) auto;align-items:end;gap:8px;margin-top:4px;display:grid}.Esk04W_field{flex-direction:column;gap:4px;min-width:0;display:flex}.Esk04W_field label{color:var(--dsw-alias-label-tertiary);font-size:12px}";
		const tagId = "dsh-custom-env/EnvSettingsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-custom-env";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var EnvSettingsSection_module_css_default = {
			"actions": "Esk04W_actions",
			"add": "Esk04W_add",
			"empty": "Esk04W_empty",
			"field": "Esk04W_field",
			"heading": "Esk04W_heading",
			"hint": "Esk04W_hint",
			"intro": "Esk04W_intro",
			"list": "Esk04W_list",
			"path": "Esk04W_path",
			"row": "Esk04W_row",
			"section": "Esk04W_section",
			"status": "Esk04W_status"
		};
		//#endregion
		//#region src/client/EnvSettingsSection.tsx
		/** Settings section: list / upsert / remove `$DSH_HOME/.env` entries. */
		const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u;
		/**
		* Render the environment-variables settings page.
		* @param props - locale `t` and Host remote callbacks.
		*/
		function EnvSettingsSection({ t, load, upsert, remove }) {
			const [snapshot, setSnapshot] = (0, react.useState)();
			const [drafts, setDrafts] = (0, react.useState)({});
			const [newName, setNewName] = (0, react.useState)("");
			const [newValue, setNewValue] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)();
			const [nameError, setNameError] = (0, react.useState)(false);
			const refresh = (0, react.useCallback)(async () => {
				setBusy(true);
				setError(void 0);
				try {
					const next = await load();
					setSnapshot(next);
					const nextDrafts = {};
					for (const entry of next.entries) nextDrafts[entry.name] = entry.value;
					setDrafts(nextDrafts);
				} catch (_error) {
					setError(t("error"));
				} finally {
					setBusy(false);
				}
			}, [load, t]);
			(0, react.useEffect)(() => {
				refresh();
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
				run(async () => {
					const next = await upsert(name, newValue);
					setNewName("");
					setNewValue("");
					return next;
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: EnvSettingsSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: EnvSettingsSection_module_css_default.heading,
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.intro,
						children: t("intro")
					}),
					snapshot !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.path,
						children: t("path", { path: snapshot.path })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.hint,
						children: t("osSync")
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.status,
						"data-tone": "error",
						role: "status",
						children: error
					}),
					snapshot === void 0 && busy ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.status,
						children: t("loading")
					}) : null,
					snapshot !== void 0 && snapshot.entries.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.empty,
						children: t("empty")
					}) : null,
					snapshot !== void 0 && snapshot.entries.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: EnvSettingsSection_module_css_default.list,
						children: snapshot.entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: EnvSettingsSection_module_css_default.row,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: EnvSettingsSection_module_css_default.field,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", { children: t("name") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
										value: entry.name,
										disabled: true,
										readOnly: true,
										"aria-label": t("name")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: EnvSettingsSection_module_css_default.field,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: `env-value-${entry.name}`,
										children: t("value")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
										id: `env-value-${entry.name}`,
										value: drafts[entry.name] ?? entry.value,
										disabled: busy,
										"aria-label": t("value"),
										onChange: (event) => {
											const value = event.target.value;
											setDrafts((previous) => ({
												...previous,
												[entry.name]: value
											}));
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: EnvSettingsSection_module_css_default.actions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "outline",
										disabled: busy || (drafts[entry.name] ?? entry.value) === entry.value,
										onClick: () => {
											run(() => upsert(entry.name, drafts[entry.name] ?? entry.value));
										},
										children: t("save")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										size: "sm",
										variant: "ghost",
										disabled: busy,
										onClick: () => {
											run(() => remove(entry.name));
										},
										children: t("remove")
									})]
								})
							]
						}, entry.name))
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: EnvSettingsSection_module_css_default.add,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: EnvSettingsSection_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: "env-new-name",
									children: t("name")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									id: "env-new-name",
									value: newName,
									disabled: busy,
									placeholder: t("namePlaceholder"),
									"aria-invalid": nameError || void 0,
									onChange: (event) => {
										setNewName(event.target.value);
										setNameError(false);
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: EnvSettingsSection_module_css_default.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: "env-new-value",
									children: t("value")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
									id: "env-new-value",
									value: newValue,
									disabled: busy,
									placeholder: t("valuePlaceholder"),
									onChange: (event) => {
										setNewValue(event.target.value);
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								disabled: busy || newName.trim() === "",
								onClick: onAdd,
								children: t("add")
							})
						]
					}),
					nameError ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: EnvSettingsSection_module_css_default.status,
						"data-tone": "error",
						role: "status",
						children: t("invalidName")
					}) : null
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** Locale dictionaries for the environment-variables settings section. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "settings.env";
		/** English copy. */
		const en = {
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
			loading: "Loading…",
			error: "Could not update environment variables.",
			invalidName: "Use a letter or underscore first; letters, digits, and underscores after. Bootstrap names (PATH, DSH_*, …) are blocked.",
			osSync: "Synced to OS user environment (Windows / macOS)."
		};
		/** Chinese copy. */
		const zh = {
			nav: "环境变量",
			title: "环境变量",
			intro: "保存在 $DSH_HOME/.env，立即写入当前 Host 进程，并在 Windows / macOS 同步到用户环境。新开的终端才能看到 OS 侧变更。",
			path: "文件：{path}",
			empty: "还没有变量。在下方添加名称和值。",
			name: "名称",
			value: "值",
			add: "添加",
			save: "保存",
			remove: "删除",
			namePlaceholder: "MY_VAR",
			valuePlaceholder: "值",
			loading: "加载中…",
			error: "无法更新环境变量。",
			invalidName: "名称须以字母或下划线开头，其后可为字母、数字、下划线；禁止 PATH、DSH_* 等启动相关名。",
			osSync: "已同步到操作系统用户环境（Windows / macOS）。"
		};
		//#endregion
		//#region src/client/mount.ts
		/** Services required to mount the optional Remote and settings page. */
		const inject = [
			"remote",
			"slots",
			"locale"
		];
		/**
		* Register locale dictionaries and the Environment settings section.
		* @param ctx - browser context that already has `remote.customEnv`.
		*/
		function registerUi(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				en,
				zh
			}), "custom-env: dictionaries");
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
					}
				})
			}, EnvSettingsSection));
		}
		/**
		* Mount the custom-env Remote and settings UI.
		* @param ctx - Client plugin lifetime.
		* @param contribution - generated controller Remote definitions.
		* @returns disposer that removes both contributions.
		*/
		async function mountCustomEnv(ctx, contribution) {
			const unmountRemote = await ctx.remote.$mount(contribution);
			const ui = ctx.inject([
				"remote.customEnv",
				"slots",
				"locale"
			], (child) => registerUi(child));
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
		//#endregion
		//#region src/client/index.ts
		/**
		* Mount the environment settings page and its Remote methods.
		* @param ctx - browser plugin context.
		* @returns disposer joining UI and Remote withdrawal.
		*/
		async function apply(ctx) {
			return await mountCustomEnv(ctx, TYPERT_REMOTE);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map