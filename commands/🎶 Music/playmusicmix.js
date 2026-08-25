const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playmusicmix', category: '🎶 Music',
  aliases: ["pmm","mix"],
  description: 'Reproduce un mix de música',
  usage: 'playmusicmix',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/play` en Discord.')] }).catch(() => {})
  },
}
