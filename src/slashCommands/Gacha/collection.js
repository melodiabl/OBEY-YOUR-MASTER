const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Muestra tu colección de objetos del Gacha'),

  async execute (client, interaction) {
    const userData = await UserSchema.findOne({ userID: interaction.user.id })

    if (!userData || !userData.inventory || userData.inventory.length === 0) {
      return interaction.reply({ content: '📭 Tu colección está vacía. ¡Usa `/pull` para empezar!', ephemeral: true })
    }

    // Agrupar items por nombre
    const counts = {}
    userData.inventory.forEach(item => {
      const name = typeof item === 'string' ? item : item.name
      counts[name] = (counts[name] || 0) + 1
    })

    const description = Object.entries(counts)
      .map(([name, count]) => `• **${name}** x${count}`)
      .join('\n')

    const embed = new EmbedBuilder()
      .setTitle(`🎒 Colección de ${interaction.user.username}`)
      .setDescription(description)
      .setColor('Blue')
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
