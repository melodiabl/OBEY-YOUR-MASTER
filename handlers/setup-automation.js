const { z } = require('zod')
const { label, snowflake, ids } = require('./setup-fields')
const { openRecordsSetup } = require('./setup-records')
const { checkResources } = require('./setup-form')
const name = z.string().trim().min(1).max(2000).regex(/^\S+$/)
const response = { name, output: z.string().min(1).max(2000), embed: z.boolean().optional(), embeds: z.boolean().optional() }
const bool = value => /^(true|si|sí|yes)$/i.test(value.trim()) ? true : /^(false|no)$/i.test(value.trim()) ? false : null
const inputs = [
  { id: 'name', label: label('Nombre (sin espacios)', 'Name (no spaces)'), max: 2000 },
  { id: 'output', label: label('Respuesta', 'Response'), multiline: true, max: 2000 },
  { id: 'embed', label: label('Usar embed: sí / no', 'Use embed: yes / no'), max: 5, required: false, format: value => value ? 'yes' : 'no' },
]
const definitions = {
  customcommand: { title: label('Comandos personalizados', 'Custom commands'), store: 'customcommands', path: 'commands', schema: z.array(z.object(response).passthrough()).max(1000), inputs,
    key: entry => entry.name, describe: entry => `${entry.name}\n${entry.output}`,
    parse: (data, previous) => ({ ...previous, name: data.name.trim(), output: data.output, embed: data.embed.trim() ? bool(data.embed) : Boolean(previous?.embed) }),
    validate(entry, access, client, previous) { if (entry.name.toLowerCase() !== previous?.name?.toLowerCase() && (client.commands?.has(entry.name.toLowerCase()) || client.aliases?.has(entry.name.toLowerCase()))) throw new Error('setup_reserved_command') },
  },
  autodelete: { title: label('Borrado automático', 'Automatic deletion'), store: 'setups', path: 'autodelete', schema: z.array(z.object({ id: snowflake, delay: z.number().int().min(3000).max(3600000) }).passthrough()).max(1000),
    inputs: [{ id: 'id', label: label('ID del canal', 'Channel ID'), max: 20 }, { id: 'delay', label: label('Segundos (3–3600)', 'Seconds (3–3600)'), max: 4, format: value => value === undefined ? '' : value / 1000 }],
    key: entry => entry.id, describe: entry => `${entry.id}: ${entry.delay / 1000} s`,
    parse: (data, previous) => ({ ...previous, id: data.id.trim(), delay: Number(data.delay) * 1000 }),
    async validate(entry, access) {
      await checkResources(access, { type: 'channel', send: false }, entry.id)
      const target = await access.guild.channels.fetch(entry.id)
      const { PermissionFlagsBits: F } = require('discord.js')
      if (!target.permissionsFor(access.bot)?.has(F.ManageMessages)) throw new Error('setup_resource')
    },
  },
}
const listInput = (value, previous, lower = false) => {
  if (!value.trim()) return previous || []
  if (value.trim() === '-') return []
  return [...new Set(value.split(/[,\s]+/).filter(Boolean).map(item => lower ? item.toLowerCase() : item))]
}
definitions.keyword = { title: label('Respuestas por palabras clave', 'Keyword responses'), store: 'keyword', path: 'commands',
  schema: z.array(z.object({ ...response, aliases: z.array(name).max(1000), channels: ids }).passthrough()).max(1000),
  inputs: [...inputs,
    { id: 'channels', label: label('IDs de canales (vacío conserva; - vacía)', 'Channel IDs (empty keeps; - clears)'), multiline: true, max: 4000, required: false, format: value => (value || []).join('\n') },
    { id: 'aliases', label: label('Alias (vacío conserva; - vacía)', 'Aliases (empty keeps; - clears)'), multiline: true, max: 4000, required: false, format: value => (value || []).join('\n') }],
  key: entry => entry.name, describe: entry => `${entry.name}\n${entry.output}\n${(entry.channels || []).join(', ')}`,
  parse: (data, previous) => ({ ...previous, name: data.name.trim(), output: data.output, embed: data.embed.trim() ? bool(data.embed) : Boolean(previous?.embed), channels: listInput(data.channels, previous?.channels), aliases: listInput(data.aliases, previous?.aliases, true) }),
  async validate(entry, access) { for (const id of entry.channels) await checkResources(access, { type: 'channel' }, id) },
}
function openAutomationSetup(client, message, id) {
  if (!Object.hasOwn(definitions, id)) throw new Error('invalid_setup_definition')
  return openRecordsSetup(client, message, definitions[id])
}
module.exports = { openAutomationSetup, definitions }
