/** macOS: install `/usr/local/bin/dsh` → expected launcher (may conflict with Desktop). */
/** Fixed public command path used by Desktop and this plugin. */
export declare const MAC_CLI_DESTINATION = "/usr/local/bin/dsh";
/** Receipt owned by this plugin (never `.dsh-desktop-command.json`). */
export declare const MAC_CLI_RECEIPT = "/usr/local/bin/.dsh-custom-env-command.json";
declare class MacosCommandError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * Read the current symlink target at the public destination, if any.
 * @param destination - absolute path (default `/usr/local/bin/dsh`).
 */
export declare function readMacosCliLink(destination?: string): string | undefined;
/**
 * Install or repair the `/usr/local/bin/dsh` symlink to `launcher`.
 * Elevates with osascript when the first attempt hits EACCES.
 * @param launcher - absolute path of the expected `dsh` script.
 */
export declare function installMacosCliLink(launcher: string): Promise<void>;
export { MacosCommandError };
