const { SlashCommandBuilder } = require('discord.js')
const { playCoinflipBet } = require('../../systems/games/casinoService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'games',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('coinflip-bet')
    .setDescription('Apuesta al coinflip (economia)')
    .addStringOption(o =>
      o
        .setName('lado')
        .setDescription('heads/tails')
        .setRequired(true)
        .addChoices(
          { name: 'heads', value: 'heads' },
          { name: 'tails', value: 'tails' }
        )
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
    const choice = interaction.options.getString('lado', true)
    const amount = interaction.options.getInteger('cantidad', true)
    try {
      const res = await playCoinflipBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, choice, amount })
      return interaction.reply({ content: `Resultado: **${res.result}** | ${res.win ? `✅ Ganaste **${res.payout}**` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

