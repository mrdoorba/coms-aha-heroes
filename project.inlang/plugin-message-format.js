import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const pluginPath = resolve(
  process.cwd(),
  'node_modules/.bun/node_modules/@inlang/plugin-message-format/dist/index.js',
)

const pluginModule = await import(pathToFileURL(pluginPath).href)

export default pluginModule.default
