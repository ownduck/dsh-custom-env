/**
 * Spawn a child to persist OS user env without blocking the Host.
 * Sets `ELECTRON_RUN_AS_NODE` so Desktop's Electron binary runs the script as Node.
 */
import { type ChildProcess } from 'node:child_process';
/**
 * Start a child that writes `entries` into the OS user environment.
 * @param entries - Variable map to persist.
 * @returns The child process, or `undefined` when the bundled script is missing.
 */
export declare function startWriteUserEnvChild(entries: Readonly<Record<string, string>>): ChildProcess | undefined;
