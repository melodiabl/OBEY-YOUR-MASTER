const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchsc', category: '🎶 Music',
  aliases: ["ssc"],
  description: 'Busca en SoundCloud',
  usage: 'searchsc',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/search` en Discord.')] }).catch(() => {})
  },
}
