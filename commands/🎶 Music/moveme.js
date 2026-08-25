const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'moveme', category: '🎶 Music',
  aliases: [],
  description: 'Mueve al bot a tu canal de voz',
  usage: 'moveme',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const ch = message.member?.voice?.channel
    if (!ch) return message.reply({ embeds: [err('Únete a un canal de voz primero.')] }).catch(() => {})
    try {
      const state = client.music?.getState(message.guild.id)
      if (state) state.voiceChannelId = ch.id
      await client.shoukaku.leaveVoiceChannel(message.guild.id).catch(() => {})
      await new Promise(r => setTimeout(r, 600))
      await client.music.joinChannel(message.guild.id, ch.id, state?.textChannelId || message.channel.id)
      return message.reply({ embeds: [fx(E.shuffle, `Me moví a <#${ch.id}>`)] }).catch(() => {})
    } catch (e) {
      return message.reply({ embeds: [err(e.message)] }).catch(() => {})
    }
  },
}
