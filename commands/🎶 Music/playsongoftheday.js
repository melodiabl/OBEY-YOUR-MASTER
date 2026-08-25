const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playsongoftheday', category: '🎶 Music',
  aliases: ["sotd"],
  description: 'Canción del día',
  usage: 'playsongoftheday',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/play` en Discord.')] }).catch(() => {})
  },
}
