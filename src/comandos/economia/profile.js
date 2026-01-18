const { EmbedBuilder } = require('discord.js')

module.exports = {
  DESCRIPTION: 'Muestra tu perfil económico',
  ALIASES: ['perfil'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${message.author.username}`)
      .setColor('Random')
      .setDescription(`Dinero: ${userData.money || 0}\nBanco: ${userData.bank || 0}\nInventario: ${(userData.inventory && userData.inventory.length ? userData.inventory.join(', ') : 'Vacío')}\nPareja: ${userData.partner ? '<@' + userData.partner + '>' : 'Ninguna'}`)
    message.reply({ embeds: [embed] })
  }
}
