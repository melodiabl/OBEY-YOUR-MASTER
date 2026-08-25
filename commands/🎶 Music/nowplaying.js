const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'nowplaying',
  category: '🎶 Music',
  aliases: ['np', 'trackinfo'],
  description: 'Muestra información detallada sobre la canción actual',
  usage: 'nowplaying',
  parameters: { type: 'music', activeplayer: true, previoussong: false },

  run: async (client, message) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')

    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(client.la[ls].common.disabled.title)] })
    }

    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle('❌ No hay música reproduciéndose.')] })
    }

    // Envia el panel NP vivo con controles al canal de música
    await client.music.sendNowPlaying(message.guild.id, state.currentTrack)

    const info = state.currentTrack?.info || state.currentTrack
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setDescription(`🎵 Panel de **${(info?.title || '?').substring(0, 60)}** actualizado en el canal de música.`)],
    })
  },
}
