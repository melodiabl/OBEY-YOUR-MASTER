const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { Collection, PermissionsBitField } = require('discord.js')
const { buildAliases, buildCommandCatalog } = require('../handlers/command-registry')
const { createHelpService } = require('../handlers/help')
const { buildHelpMessage } = require('../handlers/helpui')
const client = { commands: new Collection(), slashCommands: new Collection(), settings: { get: () => ({ prefix: '!', MUSIC: true, NSFW: false }) } }
for (const category of fs.readdirSync(path.resolve(__dirname, '../commands'))) {
  const directory = path.resolve(__dirname, '../commands', category)
  if (!fs.statSync(directory).isDirectory()) continue
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.js'))) {
    const command = require(path.join(directory, file))
    if (command.name) client.commands.set(command.name, command)
  }
}
client.aliases = buildAliases(client.commands).aliases
require('../handlers/slashCommands')(client)
const guild = { id: 'help-fixture', ownerId: 'fixture-owner' }
const member = { id: 'help-member', guild, permissions: new PermissionsBitField(0n), roles: { cache: new Collection() }, voice: {} }
const bot = { guild, permissions: new PermissionsBitField(8n) }
const channel = { id: 'help-channel', guildId: guild.id, nsfw: false, permissionsFor: () => new PermissionsBitField(8n) }
guild.members = { fetch: async () => member, fetchMe: async () => bot }
guild.channels = { fetch: async () => channel }
client.guilds = { cache: new Collection([[guild.id, guild]]) }
;(async () => {
  const catalog = buildCommandCatalog(client)
  assert.equal(new Set(catalog.map(entry => entry.id)).size, catalog.length)
  assert.equal(catalog.find(entry => entry.id === 'prefix:addmoney').category, 'Settings')
  assert.ok(!catalog.some(entry => /[âï\uFFFD]/u.test(entry.category)), 'Catalog categories must have valid source metadata')
  const service = createHelpService(client), view = await service.read({ guildId: guild.id, actorId: member.id, channelId: channel.id })
  assert.ok(view.commands.some(entry => entry.id === 'slash:info.help'))
  assert.ok(!view.commands.some(entry => entry.category.toLowerCase().includes('owner') || entry.category.toLowerCase().includes('nsfw')))
  const summary = buildHelpMessage(view, {}); summary.embeds.forEach(embed => embed.toJSON()); summary.components.forEach(row => row.toJSON())
  for (const category of view.categories) for (let page = 0; page < Math.ceil(view.commands.filter(entry => entry.category === category).length / 5); page++) {
    const payload = buildHelpMessage(view, { category, page }); payload.embeds.forEach(embed => embed.toJSON()); payload.components.forEach(row => row.toJSON())
  }
  for (const entry of view.commands) buildHelpMessage(view, { detailId: entry.id }).embeds[0].toJSON()
  console.log(JSON.stringify({ source: 'actual loaded prefix handlers and slash schemas', catalog: catalog.length, prefix: catalog.filter(entry => entry.transport === 'prefix').length,
    slash: catalog.filter(entry => entry.transport === 'slash').length, slashRoots: client.allCommands.length, availableForFixtureMember: view.commands.length,
    unavailableInvocations: catalog.filter(entry => entry.disabled).length, categories: view.categories.length, buildersValidated: true, published: false }))
})().catch(error => { console.error(error.message); process.exitCode = 1 })
