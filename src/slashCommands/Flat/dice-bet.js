const { SlashCommandBuilder } = require('discord.js')
const { playDiceBet } = require('../../systems').games
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'games',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('dice-bet')
    .setDescription('Apuesta al dado: ganas si sale el maximo')
    .addIntegerOption(o =>
      o
        .setName('lados')
        .setDescription('Cantidad de lados (2-1000)')
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(1000)
    )
    .addIntegerOption(o =>
      o
        .setName('cantidad')
        .setDescription('Cantidad a apostar')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1_000_000_000)
    ),

  async execute (client, interaction) {
    const sides = interaction.options.getInteger('lados', true)
    const amount = interaction.options.getInteger('cantidad', true)
    try {
      const res = await playDiceBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, sides, amount })
      return interaction.reply({ content: `Salio: **${res.roll}/${res.sides}** | ${res.win ? `✅ Ganaste **${res.payout}**` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
