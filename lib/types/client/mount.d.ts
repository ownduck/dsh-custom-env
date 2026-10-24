/** Mount Remote contribution and the settings.section page. */
import type { Context } from '@deepseek-ai/cordis';
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
/** Services required to mount the optional Remote and settings page. */
export declare const inject: readonly ["remote", "slots", "locale"];
/**
 * Mount the custom-env Remote and settings UI.
 * @param ctx - Client plugin lifetime.
 * @param contribution - generated controller Remote definitions.
 * @returns disposer that removes both contributions.
 */
export declare function mountCustomEnv(ctx: Context, contribution: TypertRemoteContribution): Promise<() => Promise<void>>;
