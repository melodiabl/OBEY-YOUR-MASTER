const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'reconnect', category: '🎶 Music',
  aliases: ['rc'],
  description: 'Reconecta el bot al canal de voz',
  usage: 'reconnect',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    const vcId  = state?.voiceChannelId || message.member?.voice?.channel?.id
    if (!vcId) return message.reply({ embeds: [err('No hay canal de voz activo.')] }).catch(() => {})
    try {
      const node = client.shoukaku?.options?.nodeResolver(client.shoukaku.nodes)
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      await client.shoukaku.leaveVoiceChannel(message.guild.id).catch(() => {})
      await new Promise(r => setTimeout(r, 800))
      await client.music.joinChannel(message.guild.id, vcId, state?.textChannelId || message.channel.id)
      return message.reply({ embeds: [fx(E.link, 'Reconectado al canal de voz')] }).catch(() => {})
    } catch (e) {
      return message.reply({ embeds: [err(e.message)] }).catch(() => {})
    }
  },
}
