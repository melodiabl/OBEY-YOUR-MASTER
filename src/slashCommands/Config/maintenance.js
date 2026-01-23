const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

module.exports = createSystemSlashCommand({
  name: 'maintenance',
  description: 'Modo mantenimiento (bloquea comandos no-críticos)',
  moduleKey: 'config',
  subcommands: [
    {
      name: 'status',
      description: 'Muestra el estado del mantenimiento',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const enabled = Boolean(guildData.maintenanceEnabled)
        const msg = String(guildData.maintenanceMessage || '')

        const e = embed({
          ui,
          system: 'security',
          kind: enabled ? 'warn' : 'success',
          title: `${Emojis.security} Mantenimiento`,
          description: [
            headerLine(Emojis.security, enabled ? 'ACTIVO' : 'INACTIVO'),
            `${Emojis.dot} **Estado:** ${enabled ? `${Emojis.dnd} on` : `${Emojis.success} off`}`,
            msg ? `${Emojis.quote} ${Format.italic(msg)}` : `${Emojis.dot} *Sin mensaje personalizado*`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'on',
      description: 'Activa el modo mantenimiento',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('mensaje').setDescription('Mensaje para usuarios').setRequired(false).setMaxLength(160)) }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const message = interaction.options.getString('mensaje')?.trim() || null

        guildData.maintenanceEnabled = true
        if (message) guildData.maintenanceMessage = message
        await guildData.save()

        const e = embed({
          ui,
          system: 'security',
          kind: 'warn',
          title: `${Emojis.security} Mantenimiento activado`,
          description: [
            headerLine(Emojis.security, 'Bloqueo inteligente'),
            `${Emojis.dot} Se bloquearán comandos no-críticos.`,
            message ? `${Emojis.quote} ${Format.italic(message)}` : `${Emojis.dot} *Sin mensaje personalizado*`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'off',
      description: 'Desactiva el modo mantenimiento',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        guildData.maintenanceEnabled = false
        await guildData.save()

        const e = embed({
          ui,
          system: 'security',
          kind: 'success',
          title: `${Emojis.success} Mantenimiento desactivado`,
          description: [headerLine(Emojis.security, 'Listo'), `${Emojis.dot} El bot volvió a operar normalmente.`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'message',
      description: 'Configura el mensaje del mantenimiento',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('mensaje').setDescription('Mensaje').setRequired(true).setMaxLength(160)) }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const message = interaction.options.getString('mensaje', true).trim()
        guildData.maintenanceMessage = message
        await guildData.save()

        const e = embed({
          ui,
          system: 'security',
          kind: 'success',
          title: `${Emojis.success} Mensaje actualizado`,
          description: [headerLine(Emojis.security, 'Mantenimiento'), `${Emojis.quote} ${Format.italic(message)}`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
