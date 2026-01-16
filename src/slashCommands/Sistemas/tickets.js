const { ChannelType } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { openTicket, closeTicket, claimTicket, addUserToTicket, removeUserFromTicket } = require('../../systems/tickets/ticketService')

module.exports = createSystemSlashCommand({
  name: 'tickets',
  description: 'Sistema de tickets y soporte',
  moduleKey: 'tickets',
  defaultCooldownMs: 3_000,
  subcommands: [
    {
      name: 'open',
      description: 'Abre un ticket de soporte',
      options: [
        {
          apply: (sc) =>
            sc.addStringOption(o =>
              o.setName('motivo').setDescription('Motivo (opcional)').setRequired(false)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction) => {
        const motivo = interaction.options.getString('motivo') || null
        const { channel, ticketNumber } = await openTicket({
          client,
          guild: interaction.guild,
          opener: interaction.user,
          topic: motivo
        })
        await interaction.reply({ content: `✅ Ticket creado: <#${channel.id}> (Ticket #${ticketNumber})`, ephemeral: true })
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
        await interaction.reply({ content: `✅ Ticket #${ticket.ticketNumber} cerrado. Puedes archivar/eliminar el canal manualmente.`, ephemeral: true })
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
        await interaction.reply({ content: `✅ Ticket #${ticket.ticketNumber} claimado por <@${interaction.user.id}>.`, ephemeral: true })
      }
    },
    {
      name: 'add',
      description: 'Agrega un usuario al ticket actual',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o =>
              o.setName('usuario').setDescription('Usuario a agregar').setRequired(true)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        await addUserToTicket({ guild: interaction.guild, channel: interaction.channel, userID: user.id })
        await interaction.reply({ content: `✅ <@${user.id}> agregado al ticket.`, ephemeral: true })
      }
    },
    {
      name: 'remove',
      description: 'Quita un usuario del ticket actual',
      options: [
        {
          apply: (sc) =>
            sc.addUserOption(o =>
              o.setName('usuario').setDescription('Usuario a quitar').setRequired(true)
            )
        }
      ],
      auth: { role: INTERNAL_ROLES.MOD, perms: [] },
      handler: async (client, interaction) => {
        const user = interaction.options.getUser('usuario', true)
        await removeUserFromTicket({ channel: interaction.channel, userID: user.id })
        await interaction.reply({ content: `✅ <@${user.id}> removido del ticket.`, ephemeral: true })
      }
    },
    {
      name: 'config',
      description: 'Configura tickets (categoría y rol soporte)',
      options: [
        {
          apply: (sc) =>
            sc
              .addChannelOption(o =>
                o
                  .setName('categoria')
                  .setDescription('Categoría donde crear tickets (opcional)')
                  .addChannelTypes(ChannelType.GuildCategory)
                  .setRequired(false)
              )
              .addRoleOption(o =>
                o
                  .setName('rol_soporte')
                  .setDescription('Rol de soporte (opcional)')
                  .setRequired(false)
              )
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
          content: `✅ Tickets configurado.\nCategoría: ${doc.ticketsCategory ? `<#${doc.ticketsCategory}>` : '*Sin categoría*'}\nRol soporte: ${doc.ticketsSupportRole ? `<@&${doc.ticketsSupportRole}>` : '*Sin rol*'}`,
          ephemeral: true
        })
      }
    }
  ]
})
