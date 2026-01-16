const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { randomChoice, outcome, recordResult, getStats, top } = require('../../systems/games/rpsService')
const {
  randInt,
  playCoinflipBet,
  playDiceBet,
  playSlotsBet,
  playHigherLowerBet,
  startGuessNumber,
  guessGuessNumber
} = require('../../systems/games/casinoService')

function emojiChoice (c) {
  if (c === 'rock') return '🪨'
  if (c === 'paper') return '📄'
  return '✂️'
}

module.exports = createSystemSlashCommand({
  name: 'game',
  description: 'Minijuegos (escalable tipo top bots)',
  moduleKey: 'games',
  defaultCooldownMs: 1_500,
  groups: [
    {
      name: 'rps',
      description: 'Piedra/Papel/Tijera',
      subcommands: [
        {
          name: 'play',
          description: 'Jugar RPS',
          options: [
            {
              apply: (sc) =>
                sc.addStringOption(o =>
                  o
                    .setName('choice')
                    .setDescription('Tu elección')
                    .setRequired(true)
                    .addChoices(
                      { name: 'rock', value: 'rock' },
                      { name: 'paper', value: 'paper' },
                      { name: 'scissors', value: 'scissors' }
                    )
                )
            }
          ],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 2_000,
          handler: async (client, interaction) => {
            const player = interaction.options.getString('choice', true)
            const bot = randomChoice()
            const res = outcome(player, bot)
            const updated = await recordResult({ guildID: interaction.guild.id, userID: interaction.user.id, result: res })

            const map = { win: '✅ Ganaste', loss: '❌ Perdiste', tie: '➖ Empate' }
            return interaction.reply({
              content: `${map[res]} | Tú: ${emojiChoice(player)} vs Bot: ${emojiChoice(bot)}\nStats: W ${updated.wins} | L ${updated.losses} | T ${updated.ties} | Streak ${updated.streak}`,
              ephemeral: true
            })
          }
        },
        {
          name: 'stats',
          description: 'Stats de RPS',
          options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Usuario (opcional)').setRequired(false)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('user') || interaction.user
            const s = await getStats({ guildID: interaction.guild.id, userID: user.id })
            const embed = new EmbedBuilder()
              .setTitle(`RPS Stats • ${user.username}`)
              .setColor('Blurple')
              .addFields(
                { name: 'Wins', value: String(s.wins), inline: true },
                { name: 'Losses', value: String(s.losses), inline: true },
                { name: 'Ties', value: String(s.ties), inline: true },
                { name: 'Streak', value: String(s.streak), inline: true },
                { name: 'Best', value: String(s.bestStreak), inline: true }
              )
              .setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        },
        {
          name: 'leaderboard',
          description: 'Top de wins (RPS)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limit') || 10
            const rows = await top({ guildID: interaction.guild.id, limit })
            if (!rows.length) return interaction.reply({ content: 'No hay datos aún.', ephemeral: true })
            const lines = rows.map((r, idx) => `**${idx + 1}.** <@${r.userID}> • **${r.wins}W** (best ${r.bestStreak})`)
            const embed = new EmbedBuilder().setTitle('RPS Leaderboard').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'rng',
      description: 'Random/RNG (sin apuestas)',
      subcommands: [
        {
          name: 'coinflip',
          description: 'Cara o cruz',
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const r = Math.random() < 0.5 ? 'heads' : 'tails'
            return interaction.reply({ content: `Resultado: **${r}**`, ephemeral: true })
          }
        },
        {
          name: 'roll',
          description: 'Tira un dado',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('sides').setDescription('Caras (2-1000)').setRequired(false).setMinValue(2).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const sides = interaction.options.getInteger('sides') || 6
            const roll = randInt(1, sides)
            return interaction.reply({ content: `🎲 D${sides}: **${roll}**`, ephemeral: true })
          }
        },
        {
          name: 'random',
          description: 'Número aleatorio entre min/max',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('min').setDescription('Min').setRequired(true)).addIntegerOption(o => o.setName('max').setDescription('Max').setRequired(true)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const min = interaction.options.getInteger('min', true)
            const max = interaction.options.getInteger('max', true)
            return interaction.reply({ content: `🎲 Random: **${randInt(min, max)}**`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'bet',
      description: 'Casino (con economía)',
      subcommands: [
        {
          name: 'coinflip',
          description: 'Apuesta a cara o cruz',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('side').setDescription('heads/tails').setRequired(true).addChoices({ name: 'heads', value: 'heads' }, { name: 'tails', value: 'tails' })).addIntegerOption(o => o.setName('amount').setDescription('Apuesta').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const side = interaction.options.getString('side', true)
            const amount = interaction.options.getInteger('amount', true)
            const res = await playCoinflipBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, choice: side, amount })
            return interaction.reply({ content: `Coinflip: **${res.result}** • ${res.win ? `Ganaste +${res.payout}` : `Perdiste -${res.bet}`}`, ephemeral: true })
          }
        },
        {
          name: 'dice',
          description: 'Apuesta a un dado (gana si sale el máximo)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('amount').setDescription('Apuesta').setRequired(true).setMinValue(1)).addIntegerOption(o => o.setName('sides').setDescription('Caras').setRequired(false).setMinValue(2).setMaxValue(1000)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const amount = interaction.options.getInteger('amount', true)
            const sides = interaction.options.getInteger('sides') || 6
            const res = await playDiceBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, sides, amount })
            return interaction.reply({ content: `D${res.sides}: salió **${res.roll}** • ${res.win ? `Ganaste +${res.payout}` : `Perdiste -${res.bet}`}`, ephemeral: true })
          }
        },
        {
          name: 'slots',
          description: 'Slots (apuesta)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('amount').setDescription('Apuesta').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const amount = interaction.options.getInteger('amount', true)
            const res = await playSlotsBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, amount })
            return interaction.reply({ content: `${res.reels.join(' ')} • x${res.mult} • ${res.win ? `Ganaste +${res.payout}` : `Perdiste -${res.bet}`}`, ephemeral: true })
          }
        },
        {
          name: 'higherlower',
          description: 'Higher/Lower (1-100)',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('guess').setDescription('higher|lower').setRequired(true).addChoices({ name: 'higher (51-100)', value: 'higher' }, { name: 'lower (1-50)', value: 'lower' })).addIntegerOption(o => o.setName('amount').setDescription('Apuesta').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          cooldownMs: 3_000,
          handler: async (client, interaction) => {
            const guess = interaction.options.getString('guess', true)
            const amount = interaction.options.getInteger('amount', true)
            const res = await playHigherLowerBet({ client, guildID: interaction.guild.id, userID: interaction.user.id, guess, amount })
            return interaction.reply({ content: `Salió **${res.number}** (${res.outcome}) • ${res.win ? `Ganaste +${res.payout}` : `Perdiste -${res.bet}`}`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'guessnumber',
      description: 'Adivina el número (stateful)',
      subcommands: [
        {
          name: 'start',
          description: 'Inicia partida (1-100, 5 intentos)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('bet').setDescription('Apuesta').setRequired(true).setMinValue(1)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const bet = interaction.options.getInteger('bet', true)
            const res = await startGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, betAmount: bet })
            return interaction.reply({ content: `Partida iniciada. Apuesta **${res.bet}**. Intentos: **${res.attemptsLeft}**. Usa \`/game guessnumber guess\`.`, ephemeral: true })
          }
        },
        {
          name: 'guess',
          description: 'Adivina (1-100)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('number').setDescription('Número').setRequired(true).setMinValue(1).setMaxValue(100)) }],
          auth: { role: INTERNAL_ROLES.USER, perms: [] },
          handler: async (client, interaction) => {
            const number = interaction.options.getInteger('number', true)
            const res = await guessGuessNumber({ client, guildID: interaction.guild.id, userID: interaction.user.id, number })
            if (res.status === 'win') return interaction.reply({ content: `✅ Correcto: era **${res.target}**. Ganaste +${res.payout}.`, ephemeral: true })
            if (res.status === 'lose') return interaction.reply({ content: `❌ Perdiste. Era **${res.target}**.`, ephemeral: true })
            return interaction.reply({ content: `Pista: el número es **${res.status}**. Intentos restantes: **${res.attemptsLeft}**.`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'ttt',
      description: 'TicTacToe (placeholder)',
      subcommands: [
        { name: 'start', description: 'Inicia', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Rival').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'TTT: en desarrollo (siguiente iteración).', ephemeral: true }) },
        { name: 'move', description: 'Mover', options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('position').setDescription('1-9').setRequired(true).setMinValue(1).setMaxValue(9)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'TTT: en desarrollo.', ephemeral: true }) },
        { name: 'forfeit', description: 'Rendirse', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'TTT: en desarrollo.', ephemeral: true }) }
      ]
    },
    {
      name: 'connect4',
      description: 'Connect4 (placeholder)',
      subcommands: [
        { name: 'start', description: 'Inicia', options: [{ apply: (sc) => sc.addUserOption(o => o.setName('user').setDescription('Rival').setRequired(true)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'Connect4: en desarrollo.', ephemeral: true }) },
        { name: 'drop', description: 'Drop', options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('column').setDescription('Columna').setRequired(true).setMinValue(1).setMaxValue(7)) }], auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'Connect4: en desarrollo.', ephemeral: true }) },
        { name: 'forfeit', description: 'Rendirse', auth: { role: INTERNAL_ROLES.USER, perms: [] }, handler: async (c, i) => i.reply({ content: 'Connect4: en desarrollo.', ephemeral: true }) }
      ]
    }
  ]
})

