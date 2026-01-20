const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { playWithPet } = require('../../systems').pets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  MODULE: 'pets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('pet-play')
    .setDescription('Juega con tu mascota'),

  async execute (client, interaction) {
    try {
      const pet = await playWithPet({ client, userID: interaction.user.id })

      const embed = new EmbedBuilder()
        .setTitle('🥎 ¡Hora de Jugar!')
        .setDescription(`Has jugado con ${Format.bold(pet.name)}. ¡Se divirtió mucho!`)
        .setColor('Orange')
        .addFields(
          { name: 'Felicidad', value: Format.progressBar(pet.happiness, 100), inline: true },
          { name: 'Nivel', value: Format.inlineCode(pet.level.toString()), inline: true }
        )
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
