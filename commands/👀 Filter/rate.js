const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'rate', category: '👀 Filter',
  aliases: [],
  description: 'Cambia el rate (usa /filter)',
  usage: 'rate',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`> Usa el comando \`/filter\` para aplicar filtros avanzados.`)] }).catch(() => {})
  },
}
