const { SlashCommandBuilder } = require('discord.js')
const { guessGuessNumber } = require('../../systems').games
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'games',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('guessnumber-guess')
    .setDescription('Adivina el numero (1-100) en tu partida activa')
    .addIntegerOption(o =>
      o
        .setName('numero')
        .setDescription('Tu intento')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute (client, interaction) {
    const number = interaction.options.getInteger('numero', true)
    try {
      const res = await guessGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, number })
      if (res.status === 'win') return interaction.reply({ content: `✅ Correcto! Era **${res.target}**. Ganaste **${res.payout}**.`, ephemeral: true })
      if (res.status === 'lose') return interaction.reply({ content: `❌ Perdiste. Era **${res.target}**.`, ephemeral: true })
      return interaction.reply({ content: `Pista: es **${res.status}**. Intentos restantes: **${res.attemptsLeft}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
