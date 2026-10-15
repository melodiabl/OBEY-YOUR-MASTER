const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'removevoteskip', category: 'Music',
  aliases: ['rvs'],
  description: 'Elimina tu voto de skip',
  usage: 'removevoteskip',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: async (client, message) => {
    message.reply({ embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription(obeyUi.limit(obeyUi.owned('ℹ️ El sistema de votación no está activo.'), 4096))] }).catch(() => {})
  },
}
