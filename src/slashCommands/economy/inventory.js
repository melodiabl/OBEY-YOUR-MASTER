const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Muestra el inventario de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo inventario quieres ver')
        .setRequired(false)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)
    const items = userData.inventory || []

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.inventory} Inventario de ${user.username}`)
      .setColor('Blue')
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()

    if (!items.length) {
      embed.setDescription(`${Emojis.error} Este usuario no tiene ítems en su inventario.`)
    } else {
      // Agrupar items si se repiten
      const counts = {}
      items.forEach(item => { counts[item] = (counts[item] || 0) + 1 })

      const itemList = Object.entries(counts).map(([name, count]) =>
        `${Emojis.dot} **${name}** x${count}`
      ).join('\n')

      embed.setDescription(itemList)
    }

    await interaction.reply({ embeds: [embed] })
  }
}
