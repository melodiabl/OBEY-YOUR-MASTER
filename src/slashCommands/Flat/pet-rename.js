const { SlashCommandBuilder } = require('discord.js')
const { renamePet } = require('../../systems').pets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

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
      return interaction.reply({ content: `✅ Mascota renombrada a **${pet.name}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
