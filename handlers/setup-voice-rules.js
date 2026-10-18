const { z } = require('zod')
const { PermissionFlagsBits: F } = require('discord.js')
const { label, snowflake } = require('./setup-fields')
const { checkResources, parseFieldInput } = require('./setup-form')
const { openRecordsSetup } = require('./setup-records')
const { openSetupChoices } = require('./setup-choices')
const voice = { type: 'channel', channelTypes: [2, 13], send: false }
const voiceDefinitions = {
  messages: { title: label('Voz: mensajes de entrada', 'Voice: join messages'), store: 'joinvc', path: 'vcmessages',
    schema: z.array(z.object({ channelId: snowflake, textChannelId: snowflake, message: z.string().min(1).max(2000) }).passthrough()).max(1000),
    inputs: [{ id: 'channelId', label: label('ID del canal de voz', 'Voice channel ID'), max: 20 }, { id: 'textChannelId', label: label('ID del canal de texto', 'Text channel ID'), max: 20 }, { id: 'message', label: label('Mensaje', 'Message'), multiline: true, max: 2000 }],
    key: entry => entry.channelId, describe: entry => `${entry.channelId} → ${entry.textChannelId}\n${entry.message}`,
    parse: (data, previous) => ({ ...previous, channelId: data.channelId.trim(), textChannelId: data.textChannelId.trim(), message: data.message }),
    async validate(entry, access) { await checkResources(access, voice, entry.channelId); await checkResources(access, { type: 'channel' }, entry.textChannelId) },
  },
  roles: { title: label('Voz: roles de entrada', 'Voice: join roles'), store: 'joinvc', path: 'vcroles',
    schema: z.array(z.object({ channelId: snowflake, roleId: snowflake }).passthrough()).max(1000),
    inputs: [{ id: 'channelId', label: label('ID del canal de voz', 'Voice channel ID'), max: 20 }, { id: 'roleId', label: label('ID del rol', 'Role ID'), max: 20 }],
    key: entry => entry.channelId, describe: entry => `${entry.channelId} → ${entry.roleId}`,
    parse: (data, previous) => ({ ...previous, channelId: data.channelId.trim(), roleId: data.roleId.trim() }),
    async validate(entry, access) { await checkResources(access, voice, entry.channelId); await checkResources(access, { type: 'role', noAdmin: true }, entry.roleId) },
  },
}
const joinKinds = { username_contain: label('El nombre contiene', 'Username contains'), username_equal: label('El nombre coincide', 'Username equals'), userid: label('Usuario por ID', 'User by ID'), server_in_common: label('Pertenece a otro servidor', 'Belongs to another server'), server_not_in_common: label('No pertenece a otro servidor', 'Does not belong to another server'), noavatar: label('Sin avatar', 'No avatar') }
function joinDefinition(id) {
  if (!Object.hasOwn(joinKinds, id)) throw new Error('invalid_setup_definition')
  const dataSchema = id === 'noavatar' ? z.literal('enable') : ['userid', 'server_in_common', 'server_not_in_common'].includes(id) ? snowflake : z.string().min(1).max(100)
  const entrySchema = z.object({ data: dataSchema, action: z.enum(['kick', 'ban', 'timeout', 'setnickname']), days: z.number().int().min(0).max(7).optional(), time: z.number().int().positive().max(2419200000).optional(), nickname: z.string().min(1).max(32).optional() }).passthrough().refine(entry => entry.action === 'timeout' ? Boolean(entry.time) : entry.action === 'setnickname' ? Boolean(entry.nickname) : true)
  return { title: joinKinds[id], store: 'settings', path: `joinlist.${id}`, schema: z.array(entrySchema).max(1000),
    inputs: [{ id: 'data', label: label(id === 'noavatar' ? 'Escribe enable' : 'Nombre o ID', id === 'noavatar' ? 'Enter enable' : 'Name or ID'), max: 100 }, { id: 'action', label: label('kick / ban / timeout / setnickname', 'kick / ban / timeout / setnickname'), max: 11 }, { id: 'extra', label: label('Duración, apodo o días de borrado (0–7)', 'Duration, nickname or deletion days (0–7)'), max: 100, required: false, format: (_, record) => record?.action === 'timeout' ? record.time : record?.action === 'setnickname' ? record.nickname : record?.days }],
    key: entry => `${entry.data} | ${entry.action}`, describe: entry => `${entry.data}: ${entry.action}\n${entry.nickname || entry.time || entry.days || ''}`,
    parse(data, previous) {
      const record = { ...previous, data: data.data.trim().toLowerCase(), action: data.action.trim().toLowerCase() }
      if (record.action === 'timeout') record.time = data.extra.trim() ? parseFieldInput({ type: 'duration' }, data.extra) : previous?.time
      else if (record.action === 'setnickname') record.nickname = data.extra.trim() || previous?.nickname
      else record.days = data.extra.trim() ? Number(data.extra) : previous?.days || 0
      return record
    },
    validate(entry, access) {
      const permission = { kick: F.KickMembers, ban: F.BanMembers, timeout: F.ModerateMembers, setnickname: F.ManageNicknames }[entry.action]
      if (!access.bot.permissions.has(permission)) throw new Error('setup_resource')
    },
  }
}
function openVoiceRules(client, message, id) {
  if (id === 'joinvc') return openSetupChoices(client, message, label('Al entrar a voz', 'When joining voice'), Object.entries(voiceDefinitions).map(([key, definition]) => ({ id: key, title: definition.title, open: (client, message) => openRecordsSetup(client, message, definition) })))
  if (id === 'joinlist') return openSetupChoices(client, message, label('Reglas al entrar al servidor', 'Server join rules'), Object.entries(joinKinds).map(([key, title]) => ({ id: key, title, open: (client, message) => openRecordsSetup(client, message, joinDefinition(key)) })))
  throw new Error('invalid_setup_definition')
}
module.exports = { openVoiceRules, voiceDefinitions, joinDefinition }
