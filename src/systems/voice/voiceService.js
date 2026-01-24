const { ChannelType, PermissionsBitField } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')
const TempVoiceChannelSchema = require('../../database/schemas/TempVoiceChannelSchema')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}
function renderName ({ template, member }) {
  const t = String(template || '{user}')
  const user = member?.user
  const username = user?.username || 'user'
  const tag = user?.tag || username
  const display = member?.displayName || username
  return t
    .replaceAll('{user}', display)
    .replaceAll('{username}', username)
    .replaceAll('{tag}', tag)
    .replaceAll('{id}', String(user?.id || ''))
    .slice(0, 95)
}

async function getGuildVoiceConfig (guildID) {
  const doc = await GuildSchema.findOne({ guildID }).catch(() => null)
  return doc
}

async function lockChannel ({ channel, reason }) {
  if (!channel?.permissionOverwrites?.edit) return false
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone.id, { Connect: false }, { reason: reason || 'Voice lock' })
  return true
}

async function unlockChannel ({ channel, reason }) {
  if (!channel?.permissionOverwrites?.edit) return false
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone.id, { Connect: null }, { reason: reason || 'Voice unlock' })
  return true
}

async function createTempChannel ({ client, guild, member, config }) {
  const parentId = config.voiceTempCategory || null
  const parent = parentId ? guild.channels.cache.get(parentId) : null

  const name = renderName({ template: config.voiceTempNameTemplate, member })
  const bitrate = clamp(Number(config.voiceTempBitrate || 0), 0, 384000)
  const userLimit = clamp(Number(config.voiceTempUserLimit || 0), 0, 99)

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent?.id || undefined,
    bitrate: bitrate > 0 ? bitrate : undefined,
    userLimit: userLimit > 0 ? userLimit : undefined,
    reason: `Temp voice for ${member?.user?.id || 'unknown'}`
  })

  const doc = await new TempVoiceChannelSchema({
    guildID: guild.id,
    channelID: channel.id,
    ownerID: member.id,
    createdByJoinLobby: true,
    locked: false
  }).save().catch(() => null)

  if (config.voiceTempLockOnCreate) {
    await lockChannel({ channel, reason: 'Temp voice lock on create' }).catch(() => {})
    if (doc) {
      doc.locked = true
      await doc.save().catch(() => {})
    }
  }

  // Asegura acceso del owner aunque el canal quede lockeado.
  try {
    await channel.permissionOverwrites.edit(member.id, {
      Connect: true,
      Speak: true,
      ViewChannel: true,
      Stream: true
    })
  } catch (e) {}

  return { channel, doc }
}

async function maybeDeleteIfEmpty ({ channel }) {
  if (!channel || channel.type !== ChannelType.GuildVoice) return false
  const size = channel.members?.size || 0
  if (size > 0) return false
  await channel.delete('Temp voice: empty').catch(() => {})
  return true
}

async function cleanupOrphanTempChannels ({ client }) {
  const docs = await TempVoiceChannelSchema.find({}).limit(5000).catch(() => [])
  for (const d of docs) {
    const guild = client.guilds.cache.get(d.guildID)
    if (!guild) {
      await TempVoiceChannelSchema.deleteOne({ _id: d._id }).catch(() => {})
      continue
    }
    const channel = guild.channels.cache.get(d.channelID) || null
    if (!channel) {
      await TempVoiceChannelSchema.deleteOne({ _id: d._id }).catch(() => {})
      continue
    }
    // Si estÃ¡ vacÃ­o al arrancar (y no es el lobby), lo limpiamos.
    if ((channel.members?.size || 0) === 0) {
      await maybeDeleteIfEmpty({ channel }).catch(() => {})
      await TempVoiceChannelSchema.deleteOne({ _id: d._id }).catch(() => {})
    }
  }
}

async function handleVoiceStateUpdate ({ client, oldState, newState }) {
  const guild = newState?.guild || oldState?.guild
  if (!guild) return

  // Evita trabajo si el bot no tiene permisos base.
  const me = guild.members.me
  if (me && !me.permissions.has(PermissionsBitField.Flags.ManageChannels)) return
  if (me && !me.permissions.has(PermissionsBitField.Flags.MoveMembers)) return

  const config = await getGuildVoiceConfig(guild.id)
  if (!config) return
  const modules = config?.modules
  const voiceEnabled = modules?.get ? modules.get('voice') !== false : modules?.voice !== false
  if (!voiceEnabled) return
  if (!config.voiceTempEnabled) return

  const lobbyId = config.voiceTempLobbyChannel
  if (!lobbyId) return

  // 1) Join-to-create: al entrar al lobby, crea canal y mueve.
  if (newState?.channelId && newState.channelId === lobbyId && oldState?.channelId !== lobbyId) {
    const member = newState.member
    if (!member || member.user?.bot) return

    // No duplica: si ya tiene un temp channel existente, reutiliza.
    const existing = await TempVoiceChannelSchema.findOne({ guildID: guild.id, ownerID: member.id }).catch(() => null)
    if (existing) {
      const ch = guild.channels.cache.get(existing.channelID)
      if (ch && ch.type === ChannelType.GuildVoice) {
        await member.voice.setChannel(ch, 'Reutilizar temp voice existente').catch(() => {})
        return
      }
      await TempVoiceChannelSchema.deleteOne({ _id: existing._id }).catch(() => {})
    }

    const { channel } = await createTempChannel({ client, guild, member, config })
    await member.voice.setChannel(channel, 'Mover a canal temporal').catch(() => {})
    return
  }

  // 2) Limpieza: si alguien sale de un canal temporal y queda vacÃ­o, eliminar.
  const leftChannelId = oldState?.channelId
  if (leftChannelId && leftChannelId !== lobbyId && leftChannelId !== newState?.channelId) {
    const doc = await TempVoiceChannelSchema.findOne({ guildID: guild.id, channelID: leftChannelId }).catch(() => null)
    if (!doc) return
    const channel = guild.channels.cache.get(leftChannelId)
    if (!channel) {
      await TempVoiceChannelSchema.deleteOne({ _id: doc._id }).catch(() => {})
      return
    }
    const deleted = await maybeDeleteIfEmpty({ channel })
    if (deleted) await TempVoiceChannelSchema.deleteOne({ _id: doc._id }).catch(() => {})
  }
}

module.exports = {
  handleVoiceStateUpdate,
  cleanupOrphanTempChannels,
  lockChannel,
  unlockChannel
}
