/* Hand-maintained Remote FaceModel for @woosau/dsh-custom-env — do not treat as generator output. */
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'

declare const TYPERT_REMOTE: TypertRemoteContribution
export { TYPERT_REMOTE }
export default TYPERT_REMOTE

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'custom-env/invalid-name': { readonly name: string }
    'custom-env/invalid-value': { readonly name: string }
    'custom-env/invalid-group': { readonly group: string }
    'custom-env/cli-install-failed': { readonly code: string }
    'custom-env/restore-failed': { readonly name: string }
  }
}
