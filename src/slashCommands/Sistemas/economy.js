const { EmbedBuilder } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const UserSchema = require('../../database/schemas/UserSchema')
const { getBalances, transfer, deposit, withdraw, adminSet, fine } = require('../../systems/economy/economyService')

module.exports = createSystemSlashCommand({
  name: 'economy',
  description: 'Economía avanzada (wallet/bank/transacciones)',
  moduleKey: 'economy',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'balance',
      description: 'Muestra tu balance (o el de un usuario)',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o =>
              o.setName('usuario').setDescription('Usuario (opcional)').setRequired(false)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario') || interaction.user
        const b = await getBalances(client, user.id)
        const embed = new EmbedBuilder()
          .setTitle(`💰 Balance de ${user.username}`)
          .setColor('Green')
          .addFields(
            { name: 'Wallet', value: String(b.money), inline: true },
            { name: 'Banco', value: String(b.bank), inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    },
    {
      name: 'transfer',
      description: 'Transfiere dinero a otro usuario',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Destino').setRequired(true))
              .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      cooldownMs: 5_000,
      handler: async (client, interaction) => {
        const target = interaction.options.getUser('usuario', true)
        const amount = interaction.options.getInteger('cantidad', true)
        if (target.bot) return interaction.reply({ content: 'No puedes transferir a bots.', ephemeral: true })

        await transfer({
          client,
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          fromUserID: interaction.user.id,
          toUserID: target.id,
          amount
        })
        return interaction.reply({ content: `✅ Transferiste **${amount}** a <@${target.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'deposit',
      description: 'Deposita de tu wallet al banco',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        await deposit({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `✅ Depositaste **${amount}** al banco.`, ephemeral: true })
      }
    },
    {
      name: 'withdraw',
      description: 'Retira del banco a tu wallet',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const amount = interaction.options.getInteger('cantidad', true)
        await withdraw({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: interaction.user.id, amount })
        return interaction.reply({ content: `✅ Retiraste **${amount}** del banco.`, ephemeral: true })
      }
    },
    {
      name: 'admin-set',
      description: 'Admin: setea dinero/banco de un usuario',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addIntegerOption(o => o.setName('money').setDescription('Wallet (opcional)').setRequired(false).setMinValue(0))
              .addIntegerOption(o => o.setName('bank').setDescription('Banco (opcional)').setRequired(false).setMinValue(0))
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ECONOMY_ADMIN] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const money = interaction.options.getInteger('money')
        const bank = interaction.options.getInteger('bank')
        if (money === null && bank === null) return interaction.reply({ content: 'Debes indicar `money` y/o `bank`.', ephemeral: true })
        await adminSet({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: user.id, money, bank })
        return interaction.reply({ content: `✅ Actualizado <@${user.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'fine',
      description: 'Admin: aplica una multa (de wallet)',
      options: [
        {
          apply: (sc) =>
            sc
              .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
              .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true).setMinValue(1))
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.ECONOMY_ADMIN] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const amount = interaction.options.getInteger('cantidad', true)
        await fine({ client, guildID: interaction.guild.id, actorID: interaction.user.id, userID: user.id, amount })
        return interaction.reply({ content: `✅ Multa aplicada a <@${user.id}> por **${amount}**.`, ephemeral: true })
      }
    },
    {
      name: 'top',
      description: 'Top de riqueza (wallet + banco)',
      options: [
        {
          apply: (sc) =>
            sc.addIntegerOption(o => o.setName('limite').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20))
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const limit = interaction.options.getInteger('limite') || 10
        const rows = await UserSchema.aggregate([
          { $project: { userID: 1, total: { $add: ['$money', '$bank'] } } },
          { $sort: { total: -1 } },
          { $limit: limit }
        ])

        if (!rows.length) return interaction.reply({ content: 'No hay datos aún.', ephemeral: true })
        const lines = rows.map((r, i) => `**${i + 1}.** <@${r.userID}> — **${r.total}**`)
        const embed = new EmbedBuilder().setTitle('🏆 Top Economía').setColor('Gold').setDescription(lines.join('\n')).setTimestamp()
        return interaction.reply({ embeds: [embed], ephemeral: true })
      }
    }
  ]
})
