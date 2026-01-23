const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { tickets } = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, warnEmbed } = require('../../core/ui/uiKit')

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
              .setMaxLength(120)
          )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const topic = interaction.options.getString('tema')?.trim()
        const res = await tickets.openTicket({ client, guild: interaction.guild, opener: interaction.user, topic })
        const e = embed({
          ui,
          system: 'tickets',
          kind: 'success',
          title: `${Emojis.ticket} Ticket creado`,
          description: [
            headerLine(Emojis.ticket, `Ticket #${res.ticketNumber}`),
            `${Emojis.dot} **Canal:** <#${res.channel.id}>`,
            topic ? `${Emojis.dot} **Tema:** ${Format.inlineCode(topic)}` : null
          ].filter(Boolean).join('\n'),
          signature: 'Te atendemos en breve'
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'close',
      description: 'Cierra el ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const t = await tickets.closeTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          closedBy: interaction.user.id,
          channel: interaction.channel,
          deleteChannel: true,
          deleteDelayMs: 2500
        })
        const e = warnEmbed({
          ui,
          system: 'tickets',
          title: `Ticket #${t.ticketNumber} cerrado`,
          lines: [
            `${Emojis.dot} Cerrado por: <@${interaction.user.id}>`,
            `${Emojis.dot} Este canal se eliminará en unos segundos.`
          ]
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'claim',
      description: 'Claim del ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const t = await tickets.claimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
        const e = embed({
          ui,
          system: 'tickets',
          kind: 'success',
          title: `${Emojis.ticket} Ticket claimado`,
          description: [
            headerLine(Emojis.ticket, `Ticket #${t.ticketNumber}`),
            `${Emojis.dot} Staff: <@${interaction.user.id}>`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'unclaim',
      description: 'Quita tu claim del ticket del canal actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const t = await tickets.unclaimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
        const e = embed({
          ui,
          system: 'tickets',
          kind: 'success',
          title: `${Emojis.ticket} Claim liberado`,
          description: [
            headerLine(Emojis.ticket, `Ticket #${t.ticketNumber}`),
            `${Emojis.dot} Este ticket quedó sin claim.`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
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
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const to = interaction.options.getUser('usuario', true)
        const t = await tickets.transferTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          fromUserID: interaction.user.id,
          toUserID: to.id
        })
        const e = embed({
          ui,
          system: 'tickets',
          kind: 'success',
          title: `${Emojis.ticket} Claim transferido`,
          description: [
            headerLine(Emojis.ticket, `Ticket #${t.ticketNumber}`),
            `${Emojis.dot} De: <@${interaction.user.id}>`,
            `${Emojis.dot} A: <@${to.id}>`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
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
                  .setMaxLength(400)
              )
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const text = interaction.options.getString('texto', true)
            await tickets.addTicketNote({ guildID: interaction.guild.id, channelID: interaction.channel.id, authorID: interaction.user.id, text })
            const e = embed({
              ui,
              system: 'tickets',
              kind: 'success',
              title: `${Emojis.ticket} Nota agregada`,
              description: [
                headerLine(Emojis.ticket, 'Nota interna'),
                `${Emojis.quote} ${Format.italic(text)}`
              ].join('\n')
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
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
                  .setDescription('Máx 20')
                  .setRequired(false)
                  .setMinValue(1)
                  .setMaxValue(20)
              )
            }
          ],
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.TICKETS_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const limit = interaction.options.getInteger('limite') || 10
            const notes = await tickets.listTicketNotes({ guildID: interaction.guild.id, channelID: interaction.channel.id, limit })
            if (!notes.length) {
              const e = warnEmbed({
                ui,
                system: 'tickets',
                title: 'Sin notas',
                lines: [
                  `${Emojis.dot} Este ticket no tiene notas internas todavía.`,
                  `${Emojis.dot} Agrega una con ${Format.inlineCode('/ticket note add')}.`
                ]
              })
              return interaction.reply({ embeds: [e], ephemeral: true })
            }

            const lines = notes.map((n, idx) => {
              const ts = `<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>`
              return `${Emojis.dot} ${Format.bold(`#${idx + 1}`)} ${ts} — <@${n.authorID}>\n${Emojis.quote} ${Format.italic(n.text)}`
            })

            const e = embed({
              ui,
              system: 'tickets',
              kind: 'info',
              title: `${Emojis.ticket} Notas internas`,
              description: [headerLine(Emojis.ticket, `Últimas ${Math.min(limit, notes.length)}`), ...lines].join('\n')
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        }
      ]
    }
  ]
})
