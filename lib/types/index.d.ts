/**
 * Host service: load `$DSH_HOME/.env` into process.env and expose CRUD remotes.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { envFilePath } from './env-file.ts';
import type { EnvSnapshot } from './types.ts';
export type { EnvEntry, EnvSnapshot } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** `$DSH_HOME/.env` management remote. */
        customEnv: CustomEnvController;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        /** Name refused by bootstrap rules or dotenv syntax. */
        'custom-env/invalid-name': {
            readonly name: string;
        };
        /** Empty value rejected on upsert. */
        'custom-env/invalid-value': {
            readonly name: string;
        };
    }
}
/** Host remote for `$DSH_HOME/.env` CRUD with live Host/OS sync. */
export default class CustomEnvController extends TypertRemoteService {
    constructor(ctx: Context);
    /**
     * List current `$DSH_HOME/.env` entries.
     * @returns path, existence, and sorted entries.
     */
    list(): Promise<EnvSnapshot>;
    /**
     * Create or replace one entry, syncing Host and OS user environment.
     * @param name - writable variable name.
     * @param value - non-empty value.
     * @returns updated snapshot.
     */
    upsert(name: string, value: string): Promise<EnvSnapshot>;
    /**
     * Delete one entry from the file, Host, and OS user environment.
     * @param name - writable variable name.
     * @returns updated snapshot.
     */
    remove(name: string): Promise<EnvSnapshot>;
}
/** Re-export path helper for tests. */
export { envFilePath };
//# sourceMappingURL=index.d.ts.map