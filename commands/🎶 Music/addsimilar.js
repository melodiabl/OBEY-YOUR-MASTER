const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'addsimilar', category: '🎶 Music',
  aliases: ["similar"],
  description: 'Añade canciones similares',
  usage: 'addsimilar',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/play` en Discord.')] }).catch(() => {})
  },
}
