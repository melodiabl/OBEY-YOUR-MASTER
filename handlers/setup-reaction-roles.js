const { z } = require('zod')
const { randomUUID } = require('node:crypto')
const { EmbedBuilder, PermissionFlagsBits: F } = require('discord.js')
const { label, snowflake } = require('./setup-fields')
const { openRecordsSetup } = require('./setup-records')
const { createSetupSettings } = require('./setup-settings')
const { checkResources } = require('./setup-form')
const { publishSavedMessage, retireSavedMessage } = require('./setup-publications')
const obeyUi = require('./assets/system')
const emojiSchema = z.string().min(1).max(100).refine(value => /^\d{17,20}$/.test(value) || ([...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)].length === 1 && /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(value)))
const parameterSchema = z.object({ Emoji: emojiSchema, Emojimsg: z.string().max(150), Role: snowflake }).passthrough()
const schema = z.array(z.object({ MESSAGE_ID: z.union([snowflake, z.literal('')]), remove_others: z.boolean(), Parameters: z.array(parameterSchema).min(1).max(20), CONFIG_ID: z.string().uuid().optional(), CHANNEL_ID: snowflake.optional(), title: z.string().min(1).max(256).optional(), text: z.string().max(2000).optional(), publicationNonce: z.string().max(24).optional() }).passthrough()).max(1000)
const key = entry => entry.CONFIG_ID || entry.MESSAGE_ID
function parsePairs(input) {
  const pairs = input.trim().split(/\r?\n/).filter(line => line.trim()).map(line => {
    const match = /^(.+?)\s+(?:<@&)?(\d{17,20})>?$/.exec(line.trim())
    if (!match) throw new Error('invalid_role_rule')
    const custom = /^<a?:\w+:(\d{17,20})>$/.exec(match[1]), emoji = custom ? custom[1] : match[1]
    return { Emoji: emoji, Emojimsg: custom ? match[1] : /^\d{17,20}$/.test(emoji) ? `<:emoji:${emoji}>` : emoji, Role: match[2] }
  })
  if (new Set(pairs.map(pair => pair.Emoji.replace(/\ufe0f/g, ''))).size !== pairs.length) throw new Error('duplicate_emoji')
  return pairs
}
async function validateReactionRoles(entry, access, client, previous) {
  for (const pair of entry.Parameters) {
    await checkResources(access, { type: 'role', noAdmin: true }, pair.Role)
  }
  if (!entry.CHANNEL_ID && previous === entry) return // Unedited legacy entries remain usable by their message ID.
  await checkResources(access, { type: 'channel' }, entry.CHANNEL_ID)
  const channel = await access.guild.channels.fetch(entry.CHANNEL_ID), permissions = channel.permissionsFor(access.bot)
  if (!permissions?.has([F.ReadMessageHistory, F.AddReactions]) || entry.remove_others && !permissions.has(F.ManageMessages)) throw new Error('setup_resource')
}
function reactionPort(client, guildId, selected) {
  const service = createSetupSettings(client.reactionrole, { records: { path: 'reactionroles', default: [], schema } })
  function snapshot(value) {
    const matches = value.values.records.filter(entry => key(entry) === selected)
    if (matches.length !== 1) throw new Error('setup_conflict')
    const entry = matches[0]
    return { ...value, entry, channelId: entry.CHANNEL_ID, messageId: entry.MESSAGE_ID, nonce: entry.publicationNonce || '' }
  }
  return { key: `reactionroles:${selected}`, label: 'Roles de reacción',
    async read() { return snapshot(await service.read(guildId)) },
    async save(value, patch) {
      const records = value.values.records.map(entry => key(entry) === selected ? { ...entry, CONFIG_ID: entry.CONFIG_ID || randomUUID(), ...(patch.messageId !== undefined ? { MESSAGE_ID: patch.messageId } : {}), ...(patch.nonce !== undefined ? { publicationNonce: patch.nonce } : {}) } : entry)
      const nextKey = key(records[value.values.records.findIndex(entry => key(entry) === selected)])
      const saved = await service.save(guildId, { records }, value.revision)
      selected = nextKey
      return snapshot(saved)
    },
    async validate(access, value) { await validateReactionRoles(value.entry, access, client, value.entry) },
    async payload(access, value, existing) {
      return { embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(value.entry.title || existing?.embeds?.[0]?.title || 'Roles de reacción').setDescription(value.entry.text || (value.entry.remove_others ? 'Elige una opción / Choose one option' : 'Elige tus roles / Choose your roles')).addFields(value.entry.Parameters.map(pair => ({ name: pair.Emojimsg, value: `<@&${pair.Role}>`, inline: true })))] }
    },
    async after(access, value, message) {
      const reactions = [...(message.reactions?.cache?.values() || [])]
      for (const reaction of reactions) if (!value.entry.Parameters.some(pair => obeyUi.matchesReaction(reaction.emoji, pair.Emoji))) {
        if (!access.channel.permissionsFor(access.bot)?.has(F.ManageMessages)) throw new Error('setup_resource')
        await reaction.remove()
      }
      for (const pair of value.entry.Parameters) {
        const existing = reactions.find(reaction => obeyUi.matchesReaction(reaction.emoji, pair.Emoji))
        if (!existing?.me) await message.react(existing ? existing.emoji.id || existing.emoji.name : pair.Emoji)
      }
    },
  }
}
const definition = {
  title: label('Roles por reacciones', 'Reaction roles'), store: 'reactionrole', path: 'reactionroles', schema,
  description: label('Guarda la configuración y publica para crear o actualizar el panel. Retirar elimina su mensaje; Quitar solo borra la entrada al guardar. Los paneles antiguos necesitan su canal al editarlos.', 'Save configuration, then publish to create or update the panel. Unpublish deletes its message; Remove only deletes the entry on Save. Legacy panels need their channel when edited.'),
  inputs: [
    { id: 'CHANNEL_ID', label: label('ID del canal', 'Channel ID'), max: 20 },
    { id: 'MESSAGE_ID', label: label('ID de mensaje (vacío: crear)', 'Message ID (empty: create)'), max: 20, required: false },
    { id: 'text', label: label('Título/texto (vacío conserva)', 'Title/text (empty keeps)'), multiline: true, max: 2257, required: false, hint: label('Primera línea: título. Líneas siguientes: texto.', 'First line: title. Next lines: text.'), format: (_, entry) => [entry?.title, entry?.text].filter(Boolean).join('\n') },
    { id: 'remove_others', label: label('Una sola opción: sí / no', 'Single option: yes / no'), max: 5, required: false, format: value => value ? 'yes' : 'no' },
    { id: 'Parameters', label: label('Una línea por emoji e ID de rol', 'One emoji and role ID per line'), multiline: true, max: 4000, format: value => (value || []).map(pair => `${pair.Emojimsg} ${pair.Role}`).join('\n') },
  ], key, label: entry => entry.title || entry.MESSAGE_ID || 'Nuevo panel / New panel', describe: entry => `${entry.title || ''}\n${entry.CHANNEL_ID || 'Selecciona canal al editar / Select channel when editing'}\n${(entry.Parameters || []).map(pair => `${pair.Emojimsg}: ${pair.Role}`).join('\n')}`,
  parse(data, previous) {
    const [title, ...lines] = data.text.split(/\r?\n/), mode = data.remove_others.trim()
    const single = !mode ? Boolean(previous?.remove_others) : /^(yes|si|sí|true)$/i.test(mode) ? true : /^(no|false)$/i.test(mode) ? false : null
    return { ...previous, CONFIG_ID: previous?.CONFIG_ID || randomUUID(), CHANNEL_ID: data.CHANNEL_ID.trim(), MESSAGE_ID: data.MESSAGE_ID.trim(), remove_others: single, Parameters: parsePairs(data.Parameters).map(pair => ({ ...(previous?.Parameters?.find(old => old.Emoji === pair.Emoji && old.Role === pair.Role) || {}), ...pair })), ...(data.text.trim() ? { title, text: lines.join('\n') } : {}) }
  }, validate: validateReactionRoles,
  publish: (client, context, selected) => publishSavedMessage(client, context, reactionPort(client, context.guildId, selected)),
  unpublish: (client, context, selected) => retireSavedMessage(client, context, reactionPort(client, context.guildId, selected)),
}
const openReactionRolesSetup = (client, message) => openRecordsSetup(client, message, definition)
module.exports = { openReactionRolesSetup, definition, parsePairs, reactionPort }
