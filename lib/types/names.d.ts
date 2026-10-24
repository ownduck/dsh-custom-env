/**
 * Names and prefixes that must not be written through `$DSH_HOME/.env`
 * (mirrors app-boot bootstrap rejection).
 */
/**
 * Whether a variable may come only from the inherited process environment.
 * @param name - candidate variable name.
 * @returns true when `.env` must not set this name.
 */
export declare function isBootstrapOnly(name: string): boolean;
/**
 * Whether `name` is a writable non-bootstrap environment key.
 * @param name - candidate variable name.
 * @returns true when the key may be stored in `$DSH_HOME/.env`.
 */
export declare function isWritableEnvName(name: string): boolean;
