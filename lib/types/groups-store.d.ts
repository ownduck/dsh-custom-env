/** Sidecar JSON for environment variable groups (UI / plugin metadata only). */
import type { EnvGroup } from './types.ts';
export { DEFAULT_GROUP_ID, DEFAULT_GROUP_TITLE } from './group-ids.ts';
/** On-disk groups document. */
export interface GroupsFile {
    readonly version: 1;
    readonly groups: readonly EnvGroup[];
    /** entryId → groupId */
    readonly membership: Readonly<Record<string, string>>;
}
/** Absolute path of `$DSH_HOME/.dsh-custom-env-groups.json`. */
export declare function groupsFilePath(): string;
/**
 * Normalize arbitrary JSON into a valid groups file (always includes default).
 * @param raw - Parsed JSON or undefined.
 */
export declare function normalizeGroupsFile(raw: unknown): GroupsFile;
/** Read and normalize the groups sidecar (missing file → default only). */
export declare function readGroupsFile(): GroupsFile;
/** Persist a groups file under `$DSH_HOME`. */
export declare function writeGroupsFile(file: GroupsFile): void;
/**
 * Drop membership keys that no longer exist as live row ids.
 * @param file - Current groups file.
 * @param liveIds - Row ids still present.
 */
export declare function pruneMembership(file: GroupsFile, liveIds: ReadonlySet<string>): GroupsFile;
/**
 * Resolve the group for a row id (missing → default).
 * @param file - Groups file.
 * @param entryId - Stable row id.
 */
export declare function resolveGroupId(file: GroupsFile, entryId: string): string;
/**
 * Assign a row to a group.
 * @param file - Groups file.
 * @param entryId - Row id.
 * @param groupId - Target group (must exist, or default).
 */
export declare function setMembership(file: GroupsFile, entryId: string, groupId: string): GroupsFile;
/** Remove one row from membership. */
export declare function clearMembership(file: GroupsFile, entryId: string): GroupsFile;
/** Remove many rows from membership. */
export declare function clearMembershipMany(file: GroupsFile, entryIds: readonly string[]): GroupsFile;
/**
 * Append a custom group.
 * @param file - Groups file.
 * @param title - Non-empty display title.
 */
export declare function createGroup(file: GroupsFile, title: string): {
    readonly file: GroupsFile;
    readonly group: EnvGroup;
};
/**
 * Rename a custom group (not default).
 * @param file - Groups file.
 * @param id - Group id.
 * @param title - New title.
 */
export declare function renameGroup(file: GroupsFile, id: string, title: string): GroupsFile;
/**
 * Delete a custom group and either move or drop its membership keys.
 * Does not delete `.env` values — caller handles variable deletion when needed.
 * @param file - Groups file.
 * @param id - Group id to remove.
 * @param moveToDefault - When true, reassign members to default; else clear membership.
 */
export declare function deleteGroupMeta(file: GroupsFile, id: string, moveToDefault: boolean): {
    readonly file: GroupsFile;
    readonly memberIds: readonly string[];
};
/** Whether `groupId` exists in the file (including default). */
export declare function hasGroup(file: GroupsFile, groupId: string): boolean;
