/**
 * Child-process entry: read JSON env entries from stdin and persist to the OS user env.
 */

import { writeUserEnv } from './index.ts'

const chunks: Buffer[] = []
for await (const chunk of process.stdin) {
  chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
}
const raw = Buffer.concat(chunks).toString('utf8').trim()
if (raw === '') process.exit(0)

try {
  const entries = JSON.parse(raw) as Record<string, string>
  writeUserEnv(entries)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`custom-env child: ${message}\n`)
  process.exitCode = 1
}
