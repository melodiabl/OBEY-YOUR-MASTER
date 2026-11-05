const { fx, err, E, voiceErrorText } = require("../../bot/modulos/musica/vistas/respuestas")
module.exports = {
  name: 'reconnect', category: 'Music',
  aliases: ['rc'],
  description: 'Reconecta el bot al canal de voz',
  usage: 'reconnect',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    const vcId  = state?.voiceChannelId || message.member?.voice?.channel?.id
    if (!vcId) return message.reply({ embeds: [err('No hay canal de voz activo.')] }).catch(() => {})
    try {
      await client.music.relocateVoice(message.guild.id, { command: 'reconnect', actorId: message.author.id,
        voiceChannelId: vcId, textChannelId: state?.textChannelId || message.channel.id })
      return message.reply({ embeds: [fx(E.link, 'Reconectado al canal de voz')] }).catch(() => {})
    } catch (e) {
      return message.reply({ embeds: [err(voiceErrorText(client, message.guild.id, e))] }).catch(() => {})
    }
  },
}
