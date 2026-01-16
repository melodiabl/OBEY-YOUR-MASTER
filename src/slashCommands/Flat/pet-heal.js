const { SlashCommandBuilder } = require('discord.js')
const { healPet } = require('../../systems/pets/petService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'pets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('pet-heal')
    .setDescription('Cura a tu mascota (cuesta dinero)'),

  async execute (client, interaction) {
    try {
      const res = await healPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Mascota curada. Costo: **${res.price}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

