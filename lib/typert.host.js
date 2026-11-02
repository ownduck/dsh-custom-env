/* Hand-maintained Host FaceModel for @woosau/dsh-custom-env. */
import { z } from 'zod'

import { createTypertRemoteInfo } from '@deepseek-ai/dsh-typert-protocol/remote-info'

const envGroupSchema = () => z.object({
  id: z.string().readonly(),
  title: z.string().readonly(),
}).readonly()

const envEntrySchema = () => z.object({
  id: z.string().readonly(),
  name: z.string().readonly(),
  value: z.string().readonly(),
  groupId: z.string().readonly(),
  kind: z.enum(['unchanged', 'modified', 'added']).readonly(),
  previous: z.string().nullable().readonly(),
}).readonly()

let list$result$schema$value
const list$result$schema = () => (list$result$schema$value ??= z.object({
  path: z.string().readonly(),
  exists: z.boolean().readonly(),
  groups: z.array(envGroupSchema()).readonly(),
  entries: z.array(envEntrySchema()).readonly(),
}))

let envGroup$result$schema$value
const envGroup$result$schema = () => (envGroup$result$schema$value ??= envGroupSchema())

let cliStatus$result$schema$value
const cliStatus$result$schema = () => (cliStatus$result$schema$value ??= z.object({
  platform: z.string().readonly(),
  activePath: z.string().nullable().readonly(),
  expectedPath: z.string().nullable().readonly(),
  expectedDirectory: z.string().nullable().readonly(),
  matches: z.boolean().readonly(),
  canInstall: z.boolean().readonly(),
  reason: z.string().nullable().readonly(),
}))

const str = () => z.string()

let setVars$parameter$0$schema$value
const setVars$parameter$0$schema = () => (setVars$parameter$0$schema$value ??= z.array(z.object({
  name: z.string().readonly(),
  value: z.string().readonly(),
  group: z.string().optional(),
}).readonly()).readonly())

let removeVars$parameter$0$schema$value
const removeVars$parameter$0$schema = () => (removeVars$parameter$0$schema$value ??= z.array(z.string()).readonly())

let deleteGroup$parameter$1$schema$value
const deleteGroup$parameter$1$schema = () => (deleteGroup$parameter$1$schema$value ??= z.object({
  moveToDefault: z.boolean().readonly(),
}).readonly())

const envVarWriteJsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'string' },
    group: { type: 'string' },
  },
  required: ['name', 'value'],
  additionalProperties: false,
}

const envGroupJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
  },
  required: ['id', 'title'],
  additionalProperties: true,
}

const cliStatusJsonSchema = {
  type: 'object',
  properties: {
    platform: { type: 'string' },
    activePath: { type: ['string', 'null'] },
    expectedPath: { type: ['string', 'null'] },
    expectedDirectory: { type: ['string', 'null'] },
    matches: { type: 'boolean' },
    canInstall: { type: 'boolean' },
    reason: { type: ['string', 'null'] },
  },
  required: ['platform', 'activePath', 'expectedPath', 'expectedDirectory', 'matches', 'canInstall', 'reason'],
  additionalProperties: true,
}

const envSnapshotJsonSchema = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    exists: { type: 'boolean' },
    groups: {
      type: 'array',
      items: envGroupJsonSchema,
    },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          value: { type: 'string' },
          groupId: { type: 'string' },
          kind: { type: 'string', enum: ['unchanged', 'modified', 'added'] },
          previous: { type: ['string', 'null'] },
        },
        required: ['id', 'name', 'value', 'groupId', 'kind', 'previous'],
        additionalProperties: true,
      },
    },
  },
  required: ['path', 'exists', 'groups', 'entries'],
  additionalProperties: true,
}

const stringParam = (name, description, options = {}) => ({
  name,
  description,
  source: 'json',
  ...(options.acceptsUndefined ? { acceptsUndefined: true } : {}),
  codec: {
    mode: 'strict',
    typeSymbol: 'string',
    create: str,
    jsonSchema: { type: 'string' },
  },
})

const snapshotResult = (description = 'updated snapshot.') => ({
  mode: 'strict',
  typeSymbol: '@woosau/dsh-custom-env/types#EnvSnapshot',
  create: list$result$schema,
  description,
  jsonSchema: envSnapshotJsonSchema,
})

const groupResult = (description = 'group record.') => ({
  mode: 'strict',
  typeSymbol: '@woosau/dsh-custom-env/types#EnvGroup',
  create: envGroup$result$schema,
  description,
  jsonSchema: envGroupJsonSchema,
})

const voidResult = {
  mode: 'strict',
  typeSymbol: 'void',
  create: () => z.undefined(),
  description: 'no return value.',
  jsonSchema: { type: 'null' },
}

const src = { file: 'src/index.ts', line: 1, column: 1 }

const $remote = createTypertRemoteInfo({
  package: '@woosau/dsh-custom-env',
  methods: {
    'customEnv/list': {
      service: 'customEnv',
      description: 'List current $DSH_HOME/.env entries with groups and pending classification.',
      invocation: { kind: 'direct' },
      parameters: [],
      result: snapshotResult('path, existence, groups, and sorted entries.'),
      sourceLocation: src,
    },
    'customEnv/upsert': {
      service: 'customEnv',
      description: 'Create or update one row. Empty id creates a new row; optional groupId assigns membership.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'stable row id from list(), or empty string for a new row.'),
        stringParam('name', 'writable variable name.'),
        stringParam('value', 'value (empty string allowed).'),
        stringParam('groupId', 'target group id for create/move (optional).', { acceptsUndefined: true }),
      ],
      result: snapshotResult(),
      sourceLocation: src,
    },
    'customEnv/setVars': {
      service: 'customEnv',
      description: 'Create or replace many variables by name in one rewrite. Optional group per entry.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'entries',
          description: 'name/value pairs with optional group (last duplicate name wins).',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'readonly EnvVarWrite[]',
            create: setVars$parameter$0$schema,
            jsonSchema: { type: 'array', items: envVarWriteJsonSchema },
          },
        },
      ],
      result: voidResult,
      sourceLocation: src,
    },
    'customEnv/setVar': {
      service: 'customEnv',
      description: 'Create or replace one variable by name. Optional group: new names default to default; existing keep group when omitted.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('name', 'writable variable name.'),
        stringParam('value', 'value to store (empty string allowed).'),
        stringParam('group', 'optional group id; omit to keep existing membership.', { acceptsUndefined: true }),
      ],
      result: voidResult,
      sourceLocation: src,
    },
    'customEnv/removeVars': {
      service: 'customEnv',
      description: 'Remove many variables by name from the file, Host, and OS user environment.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'names',
          description: 'writable variable names.',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'readonly string[]',
            create: removeVars$parameter$0$schema,
            jsonSchema: { type: 'array', items: { type: 'string' } },
          },
        },
      ],
      result: {
        mode: 'strict',
        typeSymbol: 'number',
        create: () => z.number(),
        description: 'number of .env lines removed.',
        jsonSchema: { type: 'number' },
      },
      sourceLocation: src,
    },
    'customEnv/removeVar': {
      service: 'customEnv',
      description: 'Remove one variable by name from the file, Host, and OS user environment.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('name', 'writable variable name.'),
      ],
      result: {
        mode: 'strict',
        typeSymbol: 'boolean',
        create: () => z.boolean(),
        description: 'true when a .env line was removed.',
        jsonSchema: { type: 'boolean' },
      },
      sourceLocation: src,
    },
    'customEnv/deleteEntry': {
      service: 'customEnv',
      description: 'Delete one entry from the file, Host, and OS user environment.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'stable row id from list().'),
      ],
      result: snapshotResult(),
      sourceLocation: src,
    },
    'customEnv/restore': {
      service: 'customEnv',
      description: 'Restore Host-start original name+value for this id, or delete if added after start.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'stable row id from list().'),
      ],
      result: snapshotResult(),
      sourceLocation: src,
    },
    'customEnv/createGroup': {
      service: 'customEnv',
      description: 'Create a custom environment variable group.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('title', 'non-empty display title.'),
      ],
      result: groupResult('created group.'),
      sourceLocation: src,
    },
    'customEnv/renameGroup': {
      service: 'customEnv',
      description: 'Rename a custom group (not the default group).',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'group id.'),
        stringParam('title', 'new non-empty title.'),
      ],
      result: groupResult('renamed group.'),
      sourceLocation: src,
    },
    'customEnv/deleteGroup': {
      service: 'customEnv',
      description: 'Delete a custom group; optionally move members to default or remove their variables.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'group id (not default).'),
        {
          name: 'options',
          description: 'moveToDefault controls whether members are kept.',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'DeleteGroupOptions',
            create: deleteGroup$parameter$1$schema,
            jsonSchema: {
              type: 'object',
              properties: { moveToDefault: { type: 'boolean' } },
              required: ['moveToDefault'],
              additionalProperties: false,
            },
          },
        },
      ],
      result: snapshotResult(),
      sourceLocation: src,
    },
    'customEnv/moveEntry': {
      service: 'customEnv',
      description: 'Move one row into another group.',
      invocation: { kind: 'direct' },
      parameters: [
        stringParam('id', 'stable row id from list().'),
        stringParam('groupId', 'target group id.'),
      ],
      result: snapshotResult(),
      sourceLocation: src,
    },
    'customEnv/cliStatus': {
      service: 'customEnv',
      description: 'Compare the user-environment dsh with the launcher expected for this Host.',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: '@woosau/dsh-custom-env/types#CliStatus',
        create: cliStatus$result$schema,
        description: 'active path, expected path, and whether Install should be offered.',
        jsonSchema: cliStatusJsonSchema,
      },
      sourceLocation: src,
    },
    'customEnv/cliInstall': {
      service: 'customEnv',
      description: 'Install the expected CLI onto the Windows user PATH or as /usr/local/bin/dsh on macOS.',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: '@woosau/dsh-custom-env/types#CliStatus',
        create: cliStatus$result$schema,
        description: 'refreshed status after install.',
        jsonSchema: cliStatusJsonSchema,
      },
      sourceLocation: src,
    },
  },
}, z)

export const TYPERT = {
  package: '@woosau/dsh-custom-env',
  face: 'host',
  schemas: [],
  get invocations() { return $remote.descriptors },
  model: {
    services: [
      {
        description: 'Host remote for $DSH_HOME/.env CRUD with live Host/OS sync.',
        summary: 'Host remote for $DSH_HOME/.env CRUD with live Host/OS sync.',
        tags: [],
        jsDoc: '/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */',
        key: 'customEnv',
        exportName: 'default',
        members: [
          { kind: 'method', name: 'list', signature: "@Remote('list') async list(): Promise<EnvSnapshot>", summary: 'List current $DSH_HOME/.env entries and groups.', jsDoc: '/** List current `$DSH_HOME/.env` entries and groups. */' },
          { kind: 'method', name: 'upsert', signature: "@Remote('upsert') async upsert(id: string, name: string, value: string, groupId?: string): Promise<EnvSnapshot>", summary: 'Create or update one row by id.', jsDoc: '/** Create (`id === ""`) or update/rename one row. */' },
          { kind: 'method', name: 'setVars', signature: "@Remote('setVars') async setVars(entries: readonly EnvVarWrite[]): Promise<void>", summary: 'Create or replace many variables by name (optional group).', jsDoc: '/** Create or replace many variables by name. Optional group per entry. */' },
          { kind: 'method', name: 'setVar', signature: "@Remote('setVar') async setVar(name: string, value: string, group?: string): Promise<void>", summary: 'Create or replace one variable by name (optional group).', jsDoc: '/** Create or replace one variable by name. Optional group. */' },
          { kind: 'method', name: 'removeVars', signature: "@Remote('removeVars') async removeVars(names: readonly string[]): Promise<number>", summary: 'Remove many variables by name.', jsDoc: '/** Remove many variables by name. Returns how many lines were removed. */' },
          { kind: 'method', name: 'removeVar', signature: "@Remote('removeVar') async removeVar(name: string): Promise<boolean>", summary: 'Remove one variable by name.', jsDoc: '/** Remove one variable by name. Returns whether a line was removed. */' },
          { kind: 'method', name: 'deleteEntry', signature: "@Remote('deleteEntry') async deleteEntry(id: string): Promise<EnvSnapshot>", summary: 'Delete one row by stable id.', jsDoc: '/** Delete one entry by id. */' },
          { kind: 'method', name: 'restore', signature: "@Remote('restore') async restore(id: string): Promise<EnvSnapshot>", summary: 'Restore Host-start original name+value for this id.', jsDoc: '/** Restore Host-start original name+value for this id. */' },
          { kind: 'method', name: 'createGroup', signature: "@Remote('createGroup') async createGroup(title: string): Promise<EnvGroup>", summary: 'Create a custom group.', jsDoc: '/** Create a custom environment variable group. */' },
          { kind: 'method', name: 'renameGroup', signature: "@Remote('renameGroup') async renameGroup(id: string, title: string): Promise<EnvGroup>", summary: 'Rename a custom group.', jsDoc: '/** Rename a custom group (not default). */' },
          { kind: 'method', name: 'deleteGroup', signature: "@Remote('deleteGroup') async deleteGroup(id: string, options: DeleteGroupOptions): Promise<EnvSnapshot>", summary: 'Delete a custom group.', jsDoc: '/** Delete a custom group; optionally move or remove members. */' },
          { kind: 'method', name: 'moveEntry', signature: "@Remote('moveEntry') async moveEntry(id: string, groupId: string): Promise<EnvSnapshot>", summary: 'Move one row into another group.', jsDoc: '/** Move one row into another group. */' },
          { kind: 'method', name: 'cliStatus', signature: "@Remote('cliStatus') async cliStatus(): Promise<CliStatus>", summary: 'Compare user-environment dsh with this Host launcher.', jsDoc: '/** Compare the user-environment `dsh` with the launcher expected for this Host. */' },
          { kind: 'method', name: 'cliInstall', signature: "@Remote('cliInstall') async cliInstall(): Promise<CliStatus>", summary: 'Install expected CLI onto PATH or /usr/local/bin/dsh.', jsDoc: '/** Install the expected CLI onto the Windows user PATH or as `/usr/local/bin/dsh` on macOS. */' },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
}
