const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { games } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, warnEmbed } = require('../../core/ui/uiKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = createSystemSlashCommand({
  name: 'bet',
  description: 'Sistema de apuestas y juegos de azar',
  moduleKey: 'games',
  subcommands: [
    {
      name: 'coinflip',
      description: 'Apuesta al cara o cruz',
      options: [
        {
          apply: (sub) => sub.addStringOption(o =>
            o
              .setName('lado')
              .setDescription('heads/tails')
              .setRequired(true)
              .addChoices({ name: 'heads', value: 'heads' }, { name: 'tails', value: 'tails' })
          )
        },
        {
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('cantidad')
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
        const choice = interaction.options.getString('lado', true)
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playCoinflipBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, choice, amount })

        const base = [
          headerLine(Emojis.games, 'Coinflip'),
          `${Emojis.dot} **Resultado:** ${Format.inlineCode(res.result)}`,
          `${Emojis.dot} **Apuesta:** ${Format.inlineCode(money(res.bet))}`
        ]

        if (res.win) {
          const e = embed({
            ui,
            system: 'games',
            kind: 'success',
            title: `${Emojis.success} ¡Ganaste!`,
            description: base.concat(`${Emojis.dot} **Premio:** ${Format.inlineCode(money(res.payout))}`).join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const e = warnEmbed({
          ui,
          system: 'games',
          title: 'Esta vez no salió',
          lines: base.concat(`${Emojis.dot} **Resultado:** ${Emojis.error} Perdiste`)
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'dice',
      description: 'Apuesta al dado: ganas si sale el máximo',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('lados')
              .setDescription('Cantidad de lados (2-1000)')
              .setRequired(true)
              .setMinValue(2)
              .setMaxValue(1000)
          )
        },
        {
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('cantidad')
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
        const sides = interaction.options.getInteger('lados', true)
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playDiceBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, sides, amount })

        const base = [
          headerLine(Emojis.games, 'Dice'),
          `${Emojis.dot} **Tirada:** ${Format.inlineCode(`${res.roll}/${res.sides}`)}`,
          `${Emojis.dot} **Apuesta:** ${Format.inlineCode(money(res.bet))}`
        ]

        if (res.win) {
          const e = embed({
            ui,
            system: 'games',
            kind: 'success',
            title: `${Emojis.success} ¡Crítico!`,
            description: base.concat(`${Emojis.dot} **Premio:** ${Format.inlineCode(money(res.payout))}`).join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const e = warnEmbed({
          ui,
          system: 'games',
          title: 'Casi…',
          lines: base.concat(`${Emojis.dot} **Resultado:** ${Emojis.error} Perdiste`)
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'slots',
      description: 'Apuesta a las máquinas tragamonedas',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o =>
            o
              .setName('cantidad')
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
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playSlotsBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })

        const reels = Array.isArray(res.reels) ? res.reels.join(' ') : String(res.reels || '')
        const base = [
          headerLine(Emojis.games, 'Slots'),
          `${Emojis.dot} **Tirada:** ${Format.inlineCode(reels)}`,
          `${Emojis.dot} **Apuesta:** ${Format.inlineCode(money(res.bet))}`
        ]

        if (res.win) {
          const e = embed({
            ui,
            system: 'games',
            kind: 'success',
            title: `${Emojis.success} ¡Jackpot!`,
            description: base.concat(`${Emojis.dot} **Premio:** ${Format.inlineCode(money(res.payout))} ${Emojis.dot} x${Format.inlineCode(res.mult)}`).join('\n')
          })
          return interaction.reply({ embeds: [e], ephemeral: true })
        }

        const e = warnEmbed({
          ui,
          system: 'games',
          title: 'No alineó esta vez',
          lines: base.concat(`${Emojis.dot} **Resultado:** ${Emojis.error} Perdiste`)
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
