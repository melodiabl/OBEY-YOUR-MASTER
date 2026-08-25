const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchplaylist', category: '🎶 Music',
  aliases: ["spl"],
  description: 'Busca playlists',
  usage: 'searchplaylist',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/search` en Discord.')] }).catch(() => {})
  },
}
