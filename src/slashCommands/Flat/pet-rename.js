const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { renamePet } = require('../../systems').pets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  MODULE: 'pets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('pet-rename')
    .setDescription('Renombra tu mascota')
    .addStringOption(o =>
      o
        .setName('nombre')
        .setDescription('Nuevo nombre (2-20)')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const name = interaction.options.getString('nombre', true)
    try {
      const pet = await renamePet({ client, userID: interaction.user.id, name })

      const embed = new EmbedBuilder()
        .setTitle('🏷️ Mascota Renombrada')
        .setDescription(`Ahora tu mascota se llama ${Format.bold(pet.name)}.`)
        .setColor('Random')
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
