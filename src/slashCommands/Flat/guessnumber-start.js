const { SlashCommandBuilder } = require('discord.js')
const { startGuessNumber } = require('../../systems').games
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'games',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('guessnumber-start')
    .setDescription('Inicia un minijuego: adivina el numero (1-100)')
    .addIntegerOption(o =>
      o
        .setName('apuesta')
        .setDescription('Cantidad a apostar')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1_000_000_000)
    ),

  async execute (client, interaction) {
    const betAmount = interaction.options.getInteger('apuesta', true)
    try {
      const res = await startGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, betAmount })
      return interaction.reply({ content: `✅ Partida iniciada. Apuestas: **${res.bet}**. Intentos: **${res.attemptsLeft}**. Usa \`guessnumber-guess\`.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
