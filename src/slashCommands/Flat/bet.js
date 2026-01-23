const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { games } = require('../../systems')

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
          apply: (sub) => sub.addStringOption(o => o.setName('lado').setDescription('heads/tails').setRequired(true).addChoices({ name: 'heads', value: 'heads' }, { name: 'tails', value: 'tails' }))
        },
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(1).setMaxValue(1_000_000_000))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const choice = interaction.options.getString('lado', true)
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playCoinflipBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, choice, amount })
        return interaction.reply({ content: `Resultado: **${res.result}** | ${res.win ? `✅ Ganaste **${res.payout}**` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
      }
    },
    {
      name: 'dice',
      description: 'Apuesta al dado: ganas si sale el máximo',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('lados').setDescription('Cantidad de lados (2-1000)').setRequired(true).setMinValue(2).setMaxValue(1000))
        },
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(1).setMaxValue(1_000_000_000))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const sides = interaction.options.getInteger('lados', true)
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playDiceBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, sides, amount })
        return interaction.reply({ content: `Salió: **${res.roll}/${res.sides}** | ${res.win ? `✅ Ganaste **${res.payout}**` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
      }
    },
    {
      name: 'slots',
      description: 'Apuesta a las máquinas tragaperras',
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setRequired(true).setMinValue(1).setMaxValue(1_000_000_000))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        const res = await games.playSlotsBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `Slots: ${res.reels.join(' ')} | ${res.win ? `✅ Ganaste **${res.payout}** (x${res.mult})` : '❌ Perdiste'} (bet ${res.bet})`, ephemeral: true })
      }
    }
  ]
})
