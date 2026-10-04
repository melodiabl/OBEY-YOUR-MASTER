const { Collection } = require('discord.js')
const client = { slashCommands: new Collection() }
require('../handlers/slashCommands')(client)
// Validate the builders locally; never login or publish command schemas.
if (!client.allCommands?.length) throw new Error('No command schemas loaded')
const names = new Set()
for (const command of client.allCommands) {
  if (names.has(command.name)) throw new Error(`Duplicate command root: ${command.name}`)
  names.add(command.name)
  if (command.options?.length > 25) throw new Error(`Too many subcommands: ${command.name}`)
}
const subcommands = client.allCommands.reduce((sum, command) => sum + (command.options || []).filter(option => option.type === 1 || option.type === 2).length, 0)
console.log(JSON.stringify({ roots: names.size, subcommands, standalone: client.allCommands.filter(command => !(command.options || []).some(option => option.type === 1 || option.type === 2)).length, published: false }))
