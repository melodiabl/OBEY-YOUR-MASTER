#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
require('colors')
const root = path.resolve(__dirname, '..')
process.chdir(root)
const report = { generatedAt: new Date().toISOString(), commands: [], errors: [], conflicts: [] }
for (const kind of ['commands', 'slashCommands']) {
  const names = new Map()
  for (const category of fs.readdirSync(kind)) {
    const directory = path.join(kind, category)
    if (!fs.statSync(directory).isDirectory()) continue
    for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.js'))) {
      const location = path.join(directory, file)
      try {
        const command = require(path.join(root, location))
        const entry = { kind, category, file: location, name: command.name, aliases: command.aliases || [], runnable: typeof command.run === 'function', status: 'loaded', verification: 'loading-only' }
        if (!entry.name || !entry.runnable) throw new Error('Command needs a name and run function')
        report.commands.push(entry)
        for (const name of [kind === 'slashCommands' ? `${category}/${command.name}` : command.name]) {
          if (names.has(name) && names.get(name) !== location) report.conflicts.push({ kind, name, first: names.get(name), second: command.name, file: location })
          names.set(name, location)
        }
      } catch (error) { report.errors.push({ file: location, error: error.message.split('\n')[0] }) }
    }
  }
}
report.aliasResolutions = require('../handlers/command-registry').buildAliases(new Map(report.commands.filter(c => c.kind === 'commands').map(c => [c.name, require(path.join(root, c.file))]))).conflicts
fs.mkdirSync(path.join(root, 'docs/audit'), { recursive: true })
fs.writeFileSync(path.join(root, 'docs/audit/commands.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ loaded: report.commands.length, errors: report.errors, conflicts: report.conflicts }, null, 2))
process.exit(report.errors.length || report.conflicts.length ? 1 : 0)
