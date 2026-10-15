'use strict'
const { PermissionFlagsBits } = require('discord.js')
function createDiscordTransport(client) {
  async function channelFor({ guildId, channelId }) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) throw new Error('GUILD_UNAVAILABLE')
    const channel = await guild.channels.fetch(channelId)
    if (channel?.guildId !== guildId || ![0, 5].includes(channel.type) || !channel.messages) throw new Error('INVALID_CHANNEL')
    const me = await guild.members.fetchMe()
    if (!channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory])) throw new Error('BOT_PERMISSIONS')
    return channel
  }
  return {
    assertChannel: async context => { await channelFor(context) },
    send: async context => (await channelFor(context)).send(context.payload),
    async deleteOwned(context) {
      const channel = await channelFor(context)
      let message
      try { message = await channel.messages.fetch(context.messageId) }
      catch (error) { if (error.code === 10008) return; throw error }
      if (message.author?.id !== client.user.id || message.webhookId) throw new Error('NOT_OWNED')
      await message.delete()
    },
  }
}
module.exports = { createDiscordTransport }
