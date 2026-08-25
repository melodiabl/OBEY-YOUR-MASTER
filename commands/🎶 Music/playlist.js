const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playlist', category: '🎶 Music',
  aliases: ["pl"],
  description: 'Gestiona playlists guardadas',
  usage: 'playlist',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/queue` en Discord.')] }).catch(() => {})
  },
}
