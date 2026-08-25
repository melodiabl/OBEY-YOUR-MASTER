const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'pitch', category: '👀 Filter',
  aliases: ["p"],
  description: 'Cambia el pitch (usa /filter)',
  usage: 'pitch',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`> Usa el comando \`/filter\` para aplicar filtros avanzados.`)] }).catch(() => {})
  },
}
