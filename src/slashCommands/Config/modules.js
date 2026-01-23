const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, errorEmbed } = require('../../core/ui/uiKit')

function ensureMap (v) {
  if (!v) return new Map()
  if (typeof v.get === 'function') return v
  return new Map(Object.entries(v))
}

module.exports = createSystemSlashCommand({
  name: 'modules',
  description: 'Módulos del bot (activar/desactivar)',
  moduleKey: 'config',
  subcommands: [
    {
      name: 'list',
      description: 'Lista el estado de módulos',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const modules = ensureMap(guildData.modules)

        const lines = []
        for (const [k, v] of modules.entries()) {
          lines.push(`${Emojis.dot} ${Format.inlineCode(k)}: ${v === false ? '❌ off' : '✅ on'}`)
        }

        const e = embed({
          ui,
          system: 'config',
          kind: 'info',
          title: `${Emojis.system} Módulos`,
          description: [
            headerLine(Emojis.system, 'Estado'),
            lines.join('\n') || '*Sin módulos configurados (todo activo por defecto).*'
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'set',
      description: 'Activa o desactiva un módulo',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('modulo').setDescription('Clave (ej: logs, tickets, music)').setRequired(true).setMaxLength(32)) },
        { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('true = on / false = off').setRequired(true)) }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)

        const moduleKey = String(interaction.options.getString('modulo', true)).trim().toLowerCase()
        const active = Boolean(interaction.options.getBoolean('activo', true))
        if (!moduleKey) {
          const err = errorEmbed({ ui, system: 'config', title: 'Módulo inválido', reason: 'La clave del módulo está vacía.' })
          return interaction.reply({ embeds: [err], ephemeral: true })
        }

        const modules = ensureMap(guildData.modules)
        modules.set(moduleKey, active)
        guildData.modules = modules
        await guildData.save()

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} Módulo actualizado`,
          description: [
            headerLine(Emojis.system, 'Listo'),
            `${Emojis.dot} **Módulo:** ${Format.inlineCode(moduleKey)}`,
            `${Emojis.dot} **Estado:** ${active ? '✅ on' : '❌ off'}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'reset',
      description: 'Resetea la configuración de módulos (todo on)',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        guildData.modules = new Map()
        await guildData.save()

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} Módulos reseteados`,
          description: [headerLine(Emojis.system, 'Todo activo'), `${Emojis.dot} Se eliminaron overrides de módulos.`].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
