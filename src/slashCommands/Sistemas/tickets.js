const { ChannelType, EmbedBuilder, PermissionsBitField } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const {
  openTicket,
  closeTicket,
  claimTicket,
  unclaimTicket,
  transferTicket,
  setTicketPriority,
  addTicketNote,
  listTicketNotes,
  addUserToTicket,
  removeUserFromTicket,
  getTicketByChannel
} = require('../../systems/tickets/ticketService')

module.exports = createSystemSlashCommand({
  name: 'tickets',
  description: 'Sistema de tickets y soporte',
  moduleKey: 'tickets',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'note',
      description: 'Notas internas del ticket',
      subcommands: [
        {
          name: 'add',
          description: 'Agrega una nota',
          options: [{ apply: (sc) => sc.addStringOption(o => o.setName('texto').setDescription('Texto').setRequired(true).setMaxLength(800)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [] },
          handler: async (client, interaction) => {
            const text = interaction.options.getString('texto', true)
            await addTicketNote({ guildID: interaction.guild.id, channelID: interaction.channel.id, authorID: interaction.user.id, text })
            return interaction.reply({ content: 'ƒo. Nota agregada.', ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Lista notas (últimas)',
          options: [{ apply: (sc) => sc.addIntegerOption(o => o.setName('limit').setDescription('Máx 20').setRequired(false).setMinValue(1).setMaxValue(20)) }],
          auth: { role: INTERNAL_ROLES.MOD, perms: [] },
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limit') || 10
            const notes = await listTicketNotes({ guildID: interaction.guild.id, channelID: interaction.channel.id, limit })
            if (!notes.length) return interaction.reply({ content: 'No hay notas.', ephemeral: true })
            const lines = notes.map((n, idx) => `**${idx + 1}.** <@${n.authorID}> • ${new Date(n.createdAt).toLocaleString()} • ${n.text}`)
            const embed = new EmbedBuilder().setTitle('Notas del ticket').setColor('Blurple').setDescription(lines.join('\n'))
            return interaction.reply({ embeds: [embed], ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'panel',
      description: 'Panel simple (canal donde publicar instrucciones)',
      subcommands: [
        {
          name: 'set',
          description: 'Define canal de panel y publica mensaje',
          options: [{ apply: (sc) => sc.addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true).addChannelTypes(ChannelType.GuildText)) }],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.ticketsPanelChannel = channel.id
            await doc.save()

            const embed = new EmbedBuilder()
              .setTitle('Soporte')
              .setDescription('Para abrir un ticket usa `/tickets open`.\nUn staff lo tomará con `/tickets claim`.')
              .setColor('Green')
            await channel.send({ embeds: [embed] }).catch(() => {})

            return interaction.reply({ content: `ƒo. Panel configurado en <#${channel.id}>.`, ephemeral: true })
          }
        },
        {
          name: 'disable',
          description: 'Desactiva panel',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const doc = await client.db.getGuildData(interaction.guild.id)
            doc.ticketsPanelChannel = null
            await doc.save()
            return interaction.reply({ content: 'ƒo. Panel desactivado.', ephemeral: true })
          }
        }
      ]
    }
  ],
  subcommands: [
    {
      name: 'open',
      description: 'Abre un ticket de soporte',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('motivo').setDescription('Motivo (opcional)').setRequired(false).setMaxLength(120)) }],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const motivo = interaction.options.getString('motivo') || null
        const { channel, ticketNumber } = await openTicket({
          client,
          guild: interaction.guild,
          opener: interaction.user,
          topic: motivo
        })
        await interaction.reply({ content: `ƒo. Ticket creado: <#${channel.id}> (Ticket #${ticketNumber})`, ephemeral: true })
      }
    },
    {
      name: 'close',
      description: 'Cierra el ticket actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const ticket = await closeTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          closedBy: interaction.user.id
        })
        await interaction.reply({ content: `ƒo. Ticket #${ticket.ticketNumber} cerrado.`, ephemeral: true })
      }
    },
    {
      name: 'claim',
      description: 'Te asignas el ticket actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const ticket = await claimTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          userID: interaction.user.id
        })
        await interaction.reply({ content: `ƒo. Ticket #${ticket.ticketNumber} claimado por <@${interaction.user.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'unclaim',
      description: 'Dejas libre el ticket (si lo claimaste)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const ticket = await unclaimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
        await interaction.reply({ content: `ƒo. Ticket #${ticket.ticketNumber} liberado.`, ephemeral: true })
      }
    },
    {
      name: 'transfer',
      description: 'Transfiere el ticket a otro staff',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Nuevo responsable').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        const ticket = await transferTicket({
          guildID: interaction.guild.id,
          channelID: interaction.channel.id,
          fromUserID: interaction.user.id,
          toUserID: user.id
        })
        await interaction.reply({ content: `ƒo. Ticket #${ticket.ticketNumber} transferido a <@${user.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'priority',
      description: 'Cambia la prioridad del ticket',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('nivel').setDescription('low/med/high').setRequired(true).addChoices({ name: 'low', value: 'low' }, { name: 'med', value: 'med' }, { name: 'high', value: 'high' })) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const p = interaction.options.getString('nivel', true)
        const ticket = await setTicketPriority({ guildID: interaction.guild.id, channelID: interaction.channel.id, priority: p })
        await interaction.reply({ content: `ƒo. Prioridad: **${ticket.priority}**.`, ephemeral: true })
      }
    },
    {
      name: 'rename',
      description: 'Renombra el canal del ticket',
      options: [{ apply: (sc) => sc.addStringOption(o => o.setName('nombre').setDescription('Nuevo nombre').setRequired(true).setMinLength(3).setMaxLength(80)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const name = interaction.options.getString('nombre', true)
        const ticket = await getTicketByChannel({ guildID: interaction.guild.id, channelID: interaction.channel.id })
        if (!ticket) return interaction.reply({ content: 'Este canal no corresponde a un ticket.', ephemeral: true })
        await interaction.channel.setName(name).catch(() => {})
        await interaction.reply({ content: `ƒo. Ticket #${ticket.ticketNumber} renombrado.`, ephemeral: true })
      }
    },
    {
      name: 'add',
      description: 'Agrega un usuario al ticket actual',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario a agregar').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        await addUserToTicket({ channel: interaction.channel, userID: user.id })
        await interaction.reply({ content: `ƒo. <@${user.id}> agregado al ticket.`, ephemeral: true })
      }
    },
    {
      name: 'remove',
      description: 'Quita un usuario del ticket actual',
      options: [{ apply: (sc) => sc.addUserOption(o => o.setName('usuario').setDescription('Usuario a quitar').setRequired(true)) }],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        await removeUserFromTicket({ channel: interaction.channel, userID: user.id })
        await interaction.reply({ content: `ƒo. <@${user.id}> removido del ticket.`, ephemeral: true })
      }
    },
    {
      name: 'config',
      description: 'Configura tickets (categoría/rol soporte)',
      options: [
        {
          apply: (sc) =>
            sc
              .addChannelOption(o => o.setName('categoria').setDescription('Categoría (opcional)').addChannelTypes(ChannelType.GuildCategory).setRequired(false))
              .addRoleOption(o => o.setName('rol_soporte').setDescription('Rol soporte (opcional)').setRequired(false))
        }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const category = interaction.options.getChannel('categoria')
        const role = interaction.options.getRole('rol_soporte')

        const doc = await client.db.getGuildData(interaction.guild.id)
        if (category) doc.ticketsCategory = category.id
        if (role) doc.ticketsSupportRole = role.id
        await doc.save()

        return interaction.reply({
          content: `ƒo. Tickets configurado.\nCategoría: ${doc.ticketsCategory ? `<#${doc.ticketsCategory}>` : '*Sin categoría*'}\nRol soporte: ${doc.ticketsSupportRole ? `<@&${doc.ticketsSupportRole}>` : '*Sin rol*'}`,
          ephemeral: true
        })
      }
    },
    {
      name: 'lock',
      description: 'Bloquea el canal (solo staff + opener)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const ticket = await getTicketByChannel({ guildID: interaction.guild.id, channelID: interaction.channel.id })
        if (!ticket) return interaction.reply({ content: 'Este canal no corresponde a un ticket.', ephemeral: true })

        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { ViewChannel: false }).catch(() => {})
        await interaction.reply({ content: 'ƒo. Canal bloqueado.', ephemeral: true })
      }
    },
    {
      name: 'unlock',
      description: 'Desbloquea el canal (restaura permisos base)',
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const ticket = await getTicketByChannel({ guildID: interaction.guild.id, channelID: interaction.channel.id })
        if (!ticket) return interaction.reply({ content: 'Este canal no corresponde a un ticket.', ephemeral: true })

        // Re-aplica overwrites base (no destruye adicionales).
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const overwrites = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: ticket.createdBy,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          }
        ]
        if (guildData.ticketsSupportRole) {
          overwrites.push({
            id: guildData.ticketsSupportRole,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageMessages
            ]
          })
        }

        await interaction.channel.permissionOverwrites.set(overwrites).catch(() => {})
        await interaction.reply({ content: 'ƒo. Canal desbloqueado.', ephemeral: true })
      }
    }
  ]
})

