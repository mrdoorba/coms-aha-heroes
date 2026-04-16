import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const candidates = [
  resolve(process.cwd(), 'node_modules/.bun/node_modules/@inlang/plugin-message-format/dist/index.js'),
  resolve(process.cwd(), '../node_modules/.bun/node_modules/@inlang/plugin-message-format/dist/index.js'),
  resolve(process.cwd(), '../../node_modules/.bun/node_modules/@inlang/plugin-message-format/dist/index.js'),
  resolve(process.cwd(), 'node_modules/@inlang/plugin-message-format/dist/index.js'),
  resolve(process.cwd(), '../node_modules/@inlang/plugin-message-format/dist/index.js'),
  resolve(process.cwd(), '../../node_modules/@inlang/plugin-message-format/dist/index.js'),
]

const pluginPath = candidates.find((candidate) => existsSync(candidate))

if (!pluginPath) {
  throw new Error(`Could not locate @inlang/plugin-message-format from cwd ${process.cwd()}`)
}

const pluginModule = await import(pathToFileURL(pluginPath).href)

export default pluginModule.default
