const { fx, err, E } = require('../../handlers/music/responses')
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'grab', category: '🎶 Music',
  aliases: ['save', 'dm'],
  description: 'Envía por DM la canción actual',
  usage: 'grab',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const mstate = client.music?.getState(message.guild.id)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const info = mstate.currentTrack.info || mstate.currentTrack
    const dm = new EmbedBuilder().setColor(0x00ff33)
      .setTitle(`${E.music} ${info.title || '?'}`.slice(0, 250))
      .setDescription(`${E.artist} **${info.author || '?'}**\n${E.link} [Abrir enlace](${info.uri || ''})`)
      .setThumbnail(info.artworkUrl || null)
      .setFooter({ text: `Guardado desde ${message.guild.name}` })
    message.author.send({ embeds: [dm] })
      .then(() => message.reply({ embeds: [fx(E.link, 'Te envié la canción por DM 📩')] }).catch(() => {}))
      .catch(() => message.reply({ embeds: [err('No pude enviarte el DM. Revisa tu privacidad.')] }).catch(() => {}))
  },
}
