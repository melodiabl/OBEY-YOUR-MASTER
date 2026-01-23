const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { games } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, okEmbed, warnEmbed } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

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
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('apuesta')
              .setDescription('Cantidad a apostar')
              .setRequired(true)
              .setMinValue(1)
              .setMaxValue(1_000_000_000)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const betAmount = interaction.options.getInteger('apuesta', true)
        const res = await games.startGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, betAmount })
        const e = okEmbed({
          ui,
          system: 'games',
          title: `${Emojis.games} Partida iniciada`,
          lines: [
            `${Emojis.dot} **Rango:** ${Format.inlineCode('1-100')}`,
            `${Emojis.dot} **Apuesta:** ${Format.inlineCode(money(res.bet))}`,
            `${Emojis.dot} **Intentos:** ${Format.inlineCode(res.attemptsLeft)}`,
            `${Emojis.dot} Juega con ${Format.inlineCode('/guessnumber guess')}.`
          ]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'guess',
      description: 'Adivina el número en tu partida activa',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('numero')
              .setDescription('Tu intento')
              .setRequired(true)
              .setMinValue(1)
              .setMaxValue(100)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const number = interaction.options.getInteger('numero', true)
        const res = await games.guessGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, number })

        if (res.status === 'win') {
          const e = embed({
            ui,
            system: 'games',
            kind: 'success',
            title: `${Emojis.success} ¡Correcto!`,
            description: [
              headerLine(Emojis.games, 'Adivinaste'),
              `${Emojis.dot} **Número:** ${Format.inlineCode(res.target)}`,
              `${Emojis.dot} **Premio:** ${Format.inlineCode(money(res.payout))}`
            ].join('\n'),
            signature: 'Buen ojo'
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        if (res.status === 'lose') {
          const e = warnEmbed({
            ui,
            system: 'games',
            title: 'Se acabaron los intentos',
            lines: [
              `${Emojis.dot} **Era:** ${Format.inlineCode(res.target)}`,
              `${Emojis.dot} Tip: vuelve a intentar con ${Format.inlineCode('/guessnumber start')}.`
            ]
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const e = embed({
          ui,
          system: 'games',
          kind: 'info',
          title: `${Emojis.search} Pista`,
          description: [
            headerLine(Emojis.games, 'Sigue'),
            `${Emojis.dot} Es **${res.status}**.`,
            `${Emojis.dot} Intentos restantes: ${Format.inlineCode(res.attemptsLeft)}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
