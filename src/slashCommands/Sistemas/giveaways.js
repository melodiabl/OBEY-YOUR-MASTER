const ms = require('ms')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const GiveawaySchema = require('../../database/schemas/GiveawaySchema')
const { startGiveaway, endGiveaway, rerollGiveaway } = require('../../systems/giveaways/giveawayService')

module.exports = createSystemSlashCommand({
  name: 'giveaways',
  description: 'Eventos y sorteos (giveaways) con persistencia',
  moduleKey: 'events',
  defaultCooldownMs: 2_000,
  subcommands: [
    {
      name: 'start',
      description: 'Inicia un sorteo',
      options: [
        {
          apply: (sc) =>
            sc
              .addStringOption(o => o.setName('duracion').setDescription('Ej: 10m, 1h, 1d').setRequired(true))
              .addIntegerOption(o => o.setName('ganadores').setDescription('Cantidad de ganadores').setRequired(true).setMinValue(1).setMaxValue(20))
              .addStringOption(o => o.setName('premio').setDescription('Premio').setRequired(true).setMaxLength(100))
              .addChannelOption(o => o.setName('canal').setDescription('Canal (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_MANAGE] },
      handler: async (client, interaction) => {
        const dur = interaction.options.getString('duracion', true)
        const winners = interaction.options.getInteger('ganadores', true)
        const prize = interaction.options.getString('premio', true)
        const channel = interaction.options.getChannel('canal') || interaction.channel

        const msDuration = ms(dur)
        if (!msDuration || msDuration < 30_000) return interaction.reply({ content: 'Duración inválida (mínimo 30s).', ephemeral: true })

        const { doc, message } = await startGiveaway({
          client,
          guildID: interaction.guild.id,
          channel,
          createdBy: interaction.user.id,
          prize,
          winnerCount: winners,
          msDuration
        })
        return interaction.reply({ content: `✅ Sorteo iniciado: ${message.url}`, ephemeral: true })
      }
    },
    {
      name: 'end',
      description: 'Finaliza un sorteo por messageId',
      options: [
        {
          apply: (sc) =>
            sc.addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del sorteo').setRequired(true))
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LOGS_MANAGE] },
      handler: async (client, interaction) => {
        const messageID = interaction.options.getString('message_id', true)
        const doc = await GiveawaySchema.findOne({ guildID: interaction.guild.id, messageID })
        if (!doc) return interaction.reply({ content: 'No encontré un sorteo con ese message_id.', ephemeral: true })
        const res = await endGiveaway({ client, guild: interaction.guild, giveawayDoc: doc })
        return interaction.reply({ content: `✅ Sorteo finalizado. Ganadores: **${res.winners.length}**`, ephemeral: true })
      }
    },
    {
      name: 'list',
      description: 'Lista sorteos activos',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
      handler: async (client, interaction) => {
        const rows = await GiveawaySchema.find({ guildID: interaction.guild.id, ended: false }).sort({ endsAt: 1 }).limit(10)
        if (!rows.length) return interaction.reply({ content: 'No hay sorteos activos.', ephemeral: true })
        const lines = rows.map(g => `- \`${g.messageID}\` **${g.prize}** (ends <t:${Math.floor(new Date(g.endsAt).getTime() / 1000)}:R>)`)
        return interaction.reply({ content: `**Sorteos activos**\n${lines.join('\n')}`, ephemeral: true })
      }
    },
    {
      name: 'reroll',
      description: 'Reroll de ganadores (por messageId)',
      options: [
        {
          apply: (sc) =>
            sc.addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del sorteo').setRequired(true))
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.LOGS_MANAGE] },
      handler: async (client, interaction) => {
        const messageID = interaction.options.getString('message_id', true)
        const doc = await GiveawaySchema.findOne({ guildID: interaction.guild.id, messageID })
        if (!doc) return interaction.reply({ content: 'No encontré un sorteo con ese message_id.', ephemeral: true })
        const res = await rerollGiveaway({ guild: interaction.guild, giveawayDoc: doc })
        return interaction.reply({ content: `✅ Reroll ejecutado. Nuevos ganadores: **${res.winners.length}**`, ephemeral: true })
      }
    }
  ]
})
