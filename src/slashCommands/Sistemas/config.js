const { ChannelType } = require('discord.js')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

module.exports = createSystemSlashCommand({
  name: 'config',
  description: 'Configuración por servidor (settings + toggles)',
  moduleKey: 'config',
  defaultCooldownMs: 2_000,
  groups: [
    {
      name: 'channels',
      description: 'Configura canales del servidor',
      subcommands: [
        {
          name: 'logs',
          description: 'Canal de logs/auditoría',
          options: [
            {
              apply: (sc) =>
                sc.addChannelOption(o =>
                  o
                    .setName('canal')
                    .setDescription('Canal de logs')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
                )
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const g = await client.db.getGuildData(interaction.guild.id)
            g.logsChannel = channel.id
            await g.save()
            return interaction.reply({ content: `✅ logsChannel -> <#${channel.id}>`, ephemeral: true })
          }
        },
        {
          name: 'welcome',
          description: 'Canal de bienvenidas',
          options: [
            {
              apply: (sc) =>
                sc.addChannelOption(o =>
                  o
                    .setName('canal')
                    .setDescription('Canal de bienvenidas')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
                )
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const g = await client.db.getGuildData(interaction.guild.id)
            g.welcomeChannel = channel.id
            await g.save()
            return interaction.reply({ content: `✅ welcomeChannel -> <#${channel.id}>`, ephemeral: true })
          }
        },
        {
          name: 'suggestions',
          description: 'Canal de sugerencias',
          options: [
            {
              apply: (sc) =>
                sc.addChannelOption(o =>
                  o
                    .setName('canal')
                    .setDescription('Canal de sugerencias')
                    .addChannelTypes(ChannelType.GuildText)
                    .setRequired(true)
                )
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const g = await client.db.getGuildData(interaction.guild.id)
            g.suggestionChannel = channel.id
            await g.save()
            return interaction.reply({ content: `✅ suggestionChannel -> <#${channel.id}>`, ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'modules',
      description: 'Activa/desactiva sistemas',
      subcommands: [
        {
          name: 'set',
          description: 'Setea un módulo',
          options: [
            {
              apply: (sc) =>
                sc
                  .addStringOption(o =>
                    o
                      .setName('modulo')
                      .setDescription('Clave del módulo (ej: economy, moderation)')
                      .setRequired(true)
                      .setAutocomplete(true)
                  )
                  .addBooleanOption(o =>
                    o
                      .setName('habilitado')
                      .setDescription('Estado')
                      .setRequired(true)
                  )
            }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const key = interaction.options.getString('modulo', true)
            const enabled = interaction.options.getBoolean('habilitado', true)

            const g = await client.db.getGuildData(interaction.guild.id)
            const modules = normalizeMap(g.modules)
            modules.set(key, enabled)
            g.modules = modules
            await g.save()

            return interaction.reply({ content: `✅ módulo \`${key}\` -> **${enabled ? 'ON' : 'OFF'}**`, ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Lista estado de módulos',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
          handler: async (client, interaction) => {
            const g = await client.db.getGuildData(interaction.guild.id)
            const modules = normalizeMap(g.modules)
            const lines = [...modules.entries()]
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => `${v === false ? '❌' : '✅'} \`${k}\``)
            return interaction.reply({ content: lines.length ? lines.join('\n') : 'Sin módulos configurados (todo ON por defecto).', ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'general',
      description: 'Opciones generales',
      subcommands: [
        {
          name: 'show',
          description: 'Muestra configuración principal',
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.LOGS_VIEW] },
          handler: async (client, interaction) => {
            const g = await client.db.getGuildData(interaction.guild.id)
            return interaction.reply({
              content: [
                `**Config**`,
                `- logsChannel: ${g.logsChannel ? `<#${g.logsChannel}>` : '*no*'}`,
                `- welcomeChannel: ${g.welcomeChannel ? `<#${g.welcomeChannel}>` : '*no*'}`,
                `- suggestionChannel: ${g.suggestionChannel ? `<#${g.suggestionChannel}>` : '*no*'}`,
                `- globalCooldownMs: **${Number(g.globalCooldownMs || 0)}**`,
                `- ticketsCategory: ${g.ticketsCategory ? `<#${g.ticketsCategory}>` : '*no*'}`,
                `- ticketsSupportRole: ${g.ticketsSupportRole ? `<@&${g.ticketsSupportRole}>` : '*no*'}`
              ].join('\n'),
              ephemeral: true
            })
          }
        }
      ]
    }
  ]
,
  // Autocomplete para la opción "modulo" (no hardcodea IDs; solo sugiere claves existentes)
  async autocomplete (client, interaction) {
    const focused = interaction.options.getFocused(true)
    if (focused.name !== 'modulo') return interaction.respond([])

    const g = await client.db.getGuildData(interaction.guild.id)
    const modules = normalizeMap(g.modules)
    const keys = [...new Set([...modules.keys(), 'auth', 'admin', 'moderation', 'logs', 'config', 'economy', 'levels', 'jobs', 'fun', 'music', 'tickets', 'security', 'quests', 'clans'])]
    const q = String(focused.value || '').toLowerCase()
    const out = keys
      .filter(k => k.toLowerCase().includes(q))
      .slice(0, 25)
      .map(k => ({ name: k, value: k }))
    return interaction.respond(out)
  }
})
