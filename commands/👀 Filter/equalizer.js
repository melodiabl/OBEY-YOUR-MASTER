const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'equalizer', category: '👀 Filter',
  aliases: ["eq"],
  description: 'Ecualizador (usa /filter)',
  usage: 'equalizer',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`> Usa el comando \`/filter\` para aplicar filtros avanzados.`)] }).catch(() => {})
  },
}
