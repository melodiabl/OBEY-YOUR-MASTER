const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playskipsc', category: '🎶 Music',
  aliases: ["pssc"],
  description: 'Play+skip en SoundCloud',
  usage: 'playskipsc',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('> Usa el comando `/play` en Discord.')] }).catch(() => {})
  },
}
