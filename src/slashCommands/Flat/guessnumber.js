const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { games } = require('../../systems')

module.exports = createSystemSlashCommand({
  name: 'guessnumber',
  description: 'Minijuego: adivina el número',
  moduleKey: 'games',
  subcommands: [
    {
      name: 'start',
      description: 'Inicia una partida (1-100)',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('apuesta').setDescription('Cantidad a apostar').setRequired(true).setMinValue(1).setMaxValue(1_000_000_000))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const betAmount = interaction.options.getInteger('apuesta', true)
        const res = await games.startGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, betAmount })
        return interaction.reply({ content: `✅ Partida iniciada. Apuesta: **${res.bet}**. Intentos: **${res.attemptsLeft}**. Usa \`/guessnumber guess\`.`, ephemeral: true })
      }
    },
    {
      name: 'guess',
      description: 'Adivina el número en tu partida activa',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('numero').setDescription('Tu intento').setRequired(true).setMinValue(1).setMaxValue(100))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const number = interaction.options.getInteger('numero', true)
        const res = await games.guessGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, number })
        if (res.status === 'win') return interaction.reply({ content: `✅ ¡Correcto! Era **${res.target}**. Ganaste **${res.payout}**.`, ephemeral: true })
        if (res.status === 'lose') return interaction.reply({ content: `❌ Perdiste. Era **${res.target}**.`, ephemeral: true })
        return interaction.reply({ content: `Pista: es **${res.status}**. Intentos restantes: **${res.attemptsLeft}**.`, ephemeral: true })
      }
    }
  ]
})
