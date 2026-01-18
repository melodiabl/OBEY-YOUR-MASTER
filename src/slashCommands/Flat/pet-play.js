const { SlashCommandBuilder } = require('discord.js')
const { playWithPet } = require('../../systems').pets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'pets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('pet-play')
    .setDescription('Juega con tu mascota'),

  async execute (client, interaction) {
    try {
      const pet = await playWithPet({ client, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Jugaste con **${pet.name}**. Felicidad: **${pet.happiness}** | Nivel: **${pet.level}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
