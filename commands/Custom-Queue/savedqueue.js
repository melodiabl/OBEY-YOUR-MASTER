const { EmbedBuilder } = require('discord.js')
const { execute } = require('../../handlers/music/saved-queues')
module.exports = {
  name: 'savedqueue', category: 'Custom-Queue', aliases: ['savequeue', 'customqueue', 'savedqueue'],
  description: 'Guarda, organiza y reproduce tus colas de música.',
  usage: 'savedqueue <create|addcurrenttrack|addcurrentqueue|removetrack|removedupes|showall|showdetails|createsave|delete|play|shuffle> <nombre> [posición]',
  run: async (client, message, args) => {
    if (!client.settings.get(message.guild.id, 'MUSIC')) return message.reply('La música está desactivada en este servidor.')
    try {
      const text = await execute(client, {
        user: message.author, guildId: message.guild.id, voiceChannelId: message.member.voice.channelId, textChannelId: message.channel.id,
      }, args)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(text.slice(0, 4000))], allowedMentions: { parse: [] } })
    } catch (error) { return message.reply({ content: `❌ ${error.message}`, allowedMentions: { parse: [] } }) }
  },
}
