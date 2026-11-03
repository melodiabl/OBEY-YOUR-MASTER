const { fx, err, E, voiceErrorText } = require('../../handlers/music/responses')
module.exports = {
  name: 'moveme', category: 'Music',
  aliases: [],
  description: 'Mueve al bot a tu canal de voz',
  usage: 'moveme',
  parameters: { type: 'music', activeplayer: false, previoussong: false, notsamechannel: true, check_dj: true },
  run: async (client, message) => {
    const ch = message.member?.voice?.channel
    if (!ch) return message.reply({ embeds: [err('Únete a un canal de voz primero.')] }).catch(() => {})
    try {
      const state = client.music?.getState(message.guild.id)
      await client.music.relocateVoice(message.guild.id, { command: 'moveme', actorId: message.author.id,
        voiceChannelId: ch.id, textChannelId: state?.textChannelId || message.channel.id })
      return message.reply({ embeds: [fx(E.shuffle, `Me moví a <#${ch.id}>`)] }).catch(() => {})
    } catch (e) {
      return message.reply({ embeds: [err(voiceErrorText(client, message.guild.id, e))] }).catch(() => {})
    }
  },
}
