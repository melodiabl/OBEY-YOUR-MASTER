const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { tickets } = require('../../systems')

module.exports = createSystemSlashCommand({
  name: 'ticket',
  description: 'Gestiona tickets de soporte',
  moduleKey: 'tickets',
  subcommands: [
    {
      name: 'open',
      description: 'Abre un ticket de soporte',
      options: [
        {
          apply: (sub) => sub.addStringOption(o =>
            o
              .setName('tema')
              .setDescription('Tema del ticket (opcional)')
              .setRequired(false)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const topic = interaction.options.getString('tema')
        const res = await tickets.openTicket({ client, guild: interaction.guild, opener: interaction.user, topic })
        return interaction.reply({ content: `バ. Ticket #${res.ticketNumber} creado: <#${res.channel.id}>`, ephemeral: true })
      }
    },
    {
      name: 'close',
      description: 'Cierra el ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const t = await tickets.closeTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          closedBy: interaction.user.id,
          channel: interaction.channel,
          deleteChannel: true,
          deleteDelayMs: 2500
        })
        return interaction.reply({ content: `バ. Ticket #${t.ticketNumber} cerrado. Este canal será eliminado en unos segundos.`, ephemeral: true })
      }
    },
    {
      name: 'claim',
      description: 'Claim del ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const t = await tickets.claimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
        return interaction.reply({ content: `バ. Ticket #${t.ticketNumber} claimado por <@${interaction.user.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'unclaim',
      description: 'Quita tu claim del ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const t = await tickets.unclaimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
        return interaction.reply({ content: `バ. Ticket #${t.ticketNumber} ahora esta sin claim.`, ephemeral: true })
      }
    },
    {
      name: 'transfer',
      description: 'Transfiere el claim del ticket a otra persona',
      options: [
        {
          apply: (sub) => sub.addUserOption(o =>
            o
              .setName('usuario')
              .setDescription('Nuevo staff')
              .setRequired(true)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const to = interaction.options.getUser('usuario', true)
        const t = await tickets.transferTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          fromUserID: interaction.user.id,
          toUserID: to.id
        })
        return interaction.reply({ content: `バ. Ticket #${t.ticketNumber} transferido a <@${to.id}>.`, ephemeral: true })
      }
    }
  ],
  groups: [
    {
      name: 'note',
      description: 'Notas internas del ticket',
      subcommands: [
        {
          name: 'add',
          description: 'Agrega una nota interna al ticket',
          options: [
            {
              apply: (sub) => sub.addStringOption(o =>
                o
                  .setName('texto')
                  .setDescription('Nota')
                  .setRequired(true)
              )
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
          handler: async (client, interaction) => {
            const text = interaction.options.getString('texto', true)
            await tickets.addTicketNote({ guildID: interaction.guild.id, channelID: interaction.channel.id, authorID: interaction.user.id, text })
            return interaction.reply({ content: 'バ. Nota agregada.', ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Lista notas internas del ticket',
          options: [
            {
              apply: (sub) => sub.addIntegerOption(o =>
                o
                  .setName('limite')
                  .setDescription('Max 20')
                  .setRequired(false)
                  .setMinValue(1)
                  .setMaxValue(20)
              )
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limite') || 10
            const notes = await tickets.listTicketNotes({ guildID: interaction.guild.id, channelID: interaction.channel.id, limit })
            if (!notes.length) return interaction.reply({ content: 'No hay notas.', ephemeral: true })
            const lines = notes.map(n => {
              const ts = `<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>`
              return `${ts} por <@${n.authorID}>: ${n.text}`
            })
            return interaction.reply({ content: lines.join('\n'), ephemeral: true })
          }
        }
      ]
    }
  ]
})
