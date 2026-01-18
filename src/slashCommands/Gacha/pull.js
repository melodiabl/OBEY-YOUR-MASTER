const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

const ITEMS = [
  { name: '🌟 Legendario: Dragón Dorado', chance: 0.05, color: 'Gold' },
  { name: '💎 Épico: Espada de Diamante', chance: 0.15, color: 'Purple' },
  { name: '⚔️ Raro: Escudo de Hierro', chance: 0.30, color: 'Blue' },
  { name: '🪵 Común: Palo de Madera', chance: 0.50, color: 'Grey' }
]

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Realiza una tirada de Gacha (Cuesta 500 monedas)'),

  async execute (client, interaction) {
    const cost = 500
    const userData = await UserSchema.findOne({ userID: interaction.user.id })

    if (!userData || userData.money < cost) {
      return interaction.reply({ content: `❌ No tienes suficientes monedas. Una tirada cuesta **${cost}** monedas.`, ephemeral: true })
    }

    userData.money -= cost

    const rand = Math.random()
    let cumulativeChance = 0
    let wonItem = ITEMS[ITEMS.length - 1]

    for (const item of ITEMS) {
      cumulativeChance += item.chance
      if (rand < cumulativeChance) {
        wonItem = item
        break
      }
    }

    userData.inventory.push({
      name: wonItem.name,
      date: new Date()
    })

    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle('🎁 ¡Resultado del Gacha!')
      .setDescription(`Has gastado **${cost}** monedas y has obtenido:\n\n**${wonItem.name}**`)
      .setColor(wonItem.color)
      .setFooter({ text: `Ahora tienes ${userData.money} monedas.` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
