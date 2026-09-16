import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Astro serves the real public components; Storybook proxies their preview URLs.
const cwd = fileURLToPath(new URL('../apps/web', import.meta.url))
const children = [
  spawn('bun', ['run', 'dev', '--', '--port', '4321'], { cwd, stdio: 'inherit', env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' } }),
  spawn('bun', ['run', 'storybook'], { cwd, stdio: 'inherit' }),
]
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill('SIGTERM')
  process.exitCode = code
}
for (const child of children) {
  child.on('error', (error) => { console.error(error); stop(1) })
  child.on('exit', (code) => stop(code ?? 0))
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
