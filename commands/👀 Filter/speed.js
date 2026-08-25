const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'speed', category: '👀 Filter',
  aliases: ["sp"],
  description: 'Cambia la velocidad (usa /filter)',
  usage: 'speed',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`> Usa el comando \`/filter\` para aplicar filtros avanzados.`)] }).catch(() => {})
  },
}
