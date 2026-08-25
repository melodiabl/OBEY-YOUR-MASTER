const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchsimilar', category: '🎶 Music',
  aliases: ["ss"],
  description: 'Busca canciones similares',
  usage: 'searchsimilar',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/play` en Discord.')] }).catch(() => {})
  },
}
