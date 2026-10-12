const { PermissionFlagsBits: F } = require('discord.js')
const { buildCommandCatalog } = require('./command-registry')
const { commandDenial } = require('./music/permissions')
class HelpError extends Error { constructor(code) { super('No se pudo consultar la ayuda.'); this.code = code } }
function has(member, permissions) {
  try { return Boolean(member?.permissions?.has(permissions.map(permission => permission === 'Administrador' ? 'Administrator' : permission))) }
  catch { return false }
}
function availableCommands(client, context) {
  const { guild, member, bot, channel, settings, musicState } = context
  if (!member || member.guild?.id !== guild.id) return []
  const admin = has(member, ['Administrator'])
  return buildCommandCatalog(client).filter(entry => {
    const category = entry.category.toLowerCase()
    if (entry.disabled || category.includes('owner')) return false
    if (entry.transport === 'prefix' && !has(bot, ['EmbedLinks'])) return false
    if (entry.permissions.length && !has(member, entry.permissions)) return false
    if (category === 'administration' && !admin && guild.ownerId !== member.id) {
      const roles = [...(settings.adminroles || []), ...(settings.cmdadminroles?.[entry.name] || [])]
      if (!roles.includes(member.id) && !roles.some(id => member.roles?.cache?.has(id))) return false
    }
    if (category.includes('nsfw') && (!settings.NSFW || !channel?.nsfw)) return false
    if (category === 'fun' && settings.FUN === false || category === 'music' && settings.MUSIC === false) return false
    if (!admin && settings.botchannel?.length && !category.includes('nsfw') && !settings.botchannel.includes(channel?.id)) return false
    if (entry.transport === 'prefix' && settings.channel && channel?.id === settings.channel) return false
    if (commandDenial(client, member, entry.name, musicState?.currentTrack, { checkDj: Boolean(entry.parameters.check_dj) })) return false
    if (entry.parameters.type === 'music') {
      const voiceId = member.voice?.channelId || member.voice?.channel?.id
      if (!voiceId) return false
      if (entry.parameters.activeplayer && !musicState?.currentTrack) return false
      if (entry.parameters.previoussong && !musicState?.history?.length) return false
      if (musicState?.voiceChannelId && !entry.parameters.notsamechannel && musicState.voiceChannelId !== voiceId) return false
      if (member.voice?.channel?.permissionsFor && !member.voice.channel.permissionsFor(bot)?.has([F.Connect, F.Speak])) return false
    }
    return true
  })
}
function createHelpService(client) {
  return {
    async read(input) {
      const { guildId, actorId, channelId, query = '' } = input || {}
      const identifier = value => typeof value === 'string' && /^[a-zA-Z0-9_:-]{1,100}$/.test(value)
      if (!identifier(guildId) || !identifier(actorId) || channelId !== undefined && channelId !== null && !identifier(channelId) || typeof query !== 'string' || query.length > 100) throw new HelpError('invalid_help')
      const guild = client.guilds?.cache?.get(guildId)
      if (!guild) throw new HelpError('help_not_found')
      try {
        const [member, bot, channel] = await Promise.all([
          guild.members.fetch({ user: actorId, force: true }), guild.members.fetchMe({ force: true }),
          channelId ? guild.channels.fetch(channelId) : null,
        ])
        if (member?.id !== actorId || member.guild?.id !== guildId || channelId && (!channel || channel.id !== channelId || channel.guildId && channel.guildId !== guildId || !channel.permissionsFor(member)?.has(F.ViewChannel))) throw new HelpError('help_not_found')
        if (client._dbReady === false) throw new HelpError('help_unavailable')
        const settings = client.settings?.get(guildId) || {}
        const commands = availableCommands(client, { guild, member, bot, channel, settings, musicState: client.music?.getState(guildId) })
        const prefix = String(settings.prefix || client.config?.prefix || '!').slice(0, 32)
        const q = query.trim().toLowerCase(), slashQuery = q.startsWith('/')
        const normalized = q.replace(/^\//, '').replace(/\s+/g, '.')
        const detail = commands.find(entry => entry.id === q || entry.transport === 'slash' && entry.id === `slash:${normalized}` || !slashQuery && entry.transport === 'prefix' && (entry.name === q || entry.aliases.includes(q))) || null
        const counts = { prefix: commands.filter(entry => entry.transport === 'prefix').length, slash: commands.filter(entry => entry.transport === 'slash').length }
        return { guildId, prefix, commands, categories: [...new Set(commands.map(entry => entry.category))].sort(), counts, query, detail }
      } catch (error) { if (error instanceof HelpError) throw error; throw new HelpError('help_unavailable') }
    },
  }
}
const services = new WeakMap()
function helpService(client) { if (!services.has(client)) services.set(client, createHelpService(client)); return services.get(client) }
module.exports = { HelpError, availableCommands, createHelpService, helpService }
