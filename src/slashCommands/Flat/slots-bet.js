const { SlashCommandBuilder } = require('discord.js')
const { playSlotsBet } = require('../../systems').games
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'games',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('slots-bet')
    .setDescription('Apuesta a las slots (economia)')
    .addIntegerOption(o =>
      o
        .setName('cantidad')
        .setDescription('Cantidad a apostar')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1_000_000_000)
    ),

  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad', true)
    try {
      const res = await playSlotsBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
      return interaction.reply({ content: `Slots: ${res.reels.join(' ')} | ${res.win ? `✅ Ganaste **${res.payout}** (x${res.mult})` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
