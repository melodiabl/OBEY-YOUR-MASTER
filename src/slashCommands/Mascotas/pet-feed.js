const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { feedPet } = require('../../systems').pets
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pet-feed')
    .setDescription('Alimenta a tu mascota'),

  async execute (client, interaction) {
    try {
      const pet = await feedPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })

      const embed = new EmbedBuilder()
        .setTitle('🍖 ¡Mascota Alimentada!')
        .setDescription(`Has alimentado a ${Format.bold(pet.name)}. ¡Se ve más feliz!`)
        .setColor('Green')
        .addFields(
          { name: 'Salud', value: Format.progressBar(pet.health, 100), inline: true },
          { name: 'Nivel', value: Format.inlineCode(pet.level.toString()), inline: true }
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
