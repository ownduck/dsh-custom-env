/**
 * Names and prefixes that must not be written through `$DSH_HOME/.env`
 * (mirrors app-boot bootstrap rejection).
 */

/** Exact names no discovered `.env` file may set. */
const BOOTSTRAP_NAMES = new Set([
  'PATH', 'HOME', 'USERPROFILE', 'SHELL',
  'NODE_OPTIONS', 'NODE_PATH', 'NODE_EXTRA_CA_CERTS',
  'LD_PRELOAD', 'LD_LIBRARY_PATH', 'LD_AUDIT',
  'BASH_ENV', 'ENV', 'SHELLOPTS', 'BASHOPTS',
  'PERL5OPT', 'PERL5LIB', 'PYTHONSTARTUP', 'PYTHONPATH', 'RUBYOPT', 'RUBYLIB',
  'JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS',
  'PYTHONHOME',
  'GIT_SSH', 'GIT_SSH_COMMAND', 'GIT_EXTERNAL_DIFF', 'GIT_PAGER', 'GIT_EDITOR',
  'GIT_ASKPASS', 'SSH_ASKPASS',
  'GIT_CONFIG_GLOBAL', 'GIT_CONFIG_SYSTEM', 'GIT_CONFIG_COUNT',
  'EDITOR', 'VISUAL', 'PAGER', 'BROWSER',
  'DEEPSEEK_BASE_URL', 'DEEPSEEK_SEARCH_BASE_URL',
  'SSL_CERT_FILE', 'SSL_CERT_DIR',
  'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY',
  'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE',
  'NODE_TLS_REJECT_UNAUTHORIZED',
])

/** Name prefixes no discovered `.env` file may set. */
const BOOTSTRAP_PREFIXES = ['DSH_', 'XDG_', 'DYLD_', 'BASH_FUNC_'] as const

/** Valid dotenv key characters (POSIX-ish). */
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/u

/**
 * Whether a variable may come only from the inherited process environment.
 * @param name - candidate variable name.
 * @returns true when `.env` must not set this name.
 */
export function isBootstrapOnly(name: string): boolean {
  const upper = name.toUpperCase()
  return BOOTSTRAP_NAMES.has(upper) || BOOTSTRAP_PREFIXES.some(prefix => upper.startsWith(prefix))
}

/**
 * Whether `name` is a writable non-bootstrap environment key.
 * @param name - candidate variable name.
 * @returns true when the key may be stored in `$DSH_HOME/.env`.
 */
export function isWritableEnvName(name: string): boolean {
  return ENV_NAME.test(name) && !isBootstrapOnly(name)
}
