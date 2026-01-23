const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { invalidateIdentityCache } = require('../../core/auth/resolveInternalIdentity')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed, okEmbed, errorEmbed } = require('../../core/ui/uiKit')

function roleChoices () {
  return INTERNAL_ROLE_ORDER
    .filter(r => r !== INTERNAL_ROLES.OWNER)
    .map(r => ({ name: r, value: r }))
}

function canTouchCreator (identity) {
  return [INTERNAL_ROLES.OWNER, INTERNAL_ROLES.CREATOR].includes(identity?.role)
}

function ensureMap (v) {
  if (!v) return new Map()
  if (typeof v.get === 'function') return v
  return new Map(Object.entries(v))
}

module.exports = createSystemSlashCommand({
  name: 'auth',
  description: 'Roles internos, permisos y overrides',
  moduleKey: 'auth',
  subcommands: [
    {
      name: 'whoami',
      description: 'Muestra tu rol interno actual',
      auth: { role: INTERNAL_ROLES.USER, perms: [] },
      handler: async (client, interaction, { identity }) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const e = embed({
          ui,
          system: 'security',
          kind: 'info',
          title: `${Emojis.learning} Identidad interna`,
          description: [
            headerLine(Emojis.security, 'Quién sos (para el bot)'),
            `${Emojis.dot} **Rol:** ${Format.inlineCode(identity.role)}`,
            `${Emojis.dot} **Grants:** ${Format.inlineCode(identity.grants.length)}  ${Emojis.dot} **Denies:** ${Format.inlineCode(identity.denies.length)}`,
            `${Emojis.dot} **Usuario:** <@${interaction.user.id}>`
          ].join('\n'),
          signature: 'Acceso claro, sin sorpresas'
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ],
  groups: [
    {
      name: 'role',
      description: 'Overrides de rol por usuario',
      subcommands: [
        {
          name: 'set',
          description: 'Asigna un rol interno a un usuario (override)',
          options: [
            { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario a modificar').setRequired(true)) },
            { apply: (sub) => sub.addStringOption(o => o.setName('rol').setDescription('Rol interno').setRequired(true).addChoices(...roleChoices())) }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction, { identity }) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const target = interaction.options.getUser('usuario', true)
            const role = interaction.options.getString('rol', true)

            if (!isValidInternalRole(role) || role === INTERNAL_ROLES.OWNER) {
              const e = errorEmbed({ ui, system: 'security', title: 'Rol inválido', reason: 'Ese rol interno no es válido para overrides.' })
              return interaction.reply({ embeds: [e], ephemeral: true })
            }
            if (role === INTERNAL_ROLES.CREATOR && !canTouchCreator(identity)) {
              const e = errorEmbed({ ui, system: 'security', title: 'Acción restringida', reason: 'Solo OWNER/CREATOR puede asignar CREATOR.' })
              return interaction.reply({ embeds: [e], ephemeral: true })
            }

            await MemberAuthSchema.findOneAndUpdate(
              { guildID: interaction.guild.id, userID: target.id },
              { $set: { role } },
              { upsert: true, new: true }
            )

            invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
            const e = okEmbed({
              ui,
              system: 'security',
              title: `${Emojis.success} Rol aplicado`,
              lines: [
                `${Emojis.dot} **Usuario:** <@${target.id}>`,
                `${Emojis.dot} **Nuevo rol:** ${Format.inlineCode(role)}`
              ]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        },
        {
          name: 'clear',
          description: 'Elimina el override de rol interno de un usuario',
          options: [
            { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario a modificar').setRequired(true)) }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction, { identity }) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const target = interaction.options.getUser('usuario', true)

            try {
              const existing = await MemberAuthSchema.findOne({ guildID: interaction.guild.id, userID: target.id })
              if (existing?.role === INTERNAL_ROLES.CREATOR && !canTouchCreator(identity)) {
                const e = errorEmbed({ ui, system: 'security', title: 'Acción restringida', reason: 'Solo OWNER/CREATOR puede modificar overrides de CREATOR.' })
                return interaction.reply({ embeds: [e], ephemeral: true })
              }
            } catch (e) {}

            await MemberAuthSchema.findOneAndUpdate(
              { guildID: interaction.guild.id, userID: target.id },
              { $set: { role: null } },
              { upsert: true, new: true }
            )

            invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
            const e = okEmbed({
              ui,
              system: 'security',
              title: `${Emojis.success} Override eliminado`,
              lines: [`${Emojis.dot} **Usuario:** <@${target.id}>`]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'map',
      description: 'Mapeo de roles Discord → roles internos',
      subcommands: [
        {
          name: 'add',
          description: 'Mapea un rol de Discord a un rol interno',
          options: [
            {
              apply: (sub) => sub.addStringOption(o => o.setName('rol_interno').setDescription('Rol interno destino').setRequired(true).addChoices(
                { name: INTERNAL_ROLES.ADMIN, value: INTERNAL_ROLES.ADMIN },
                { name: INTERNAL_ROLES.MOD, value: INTERNAL_ROLES.MOD },
                { name: INTERNAL_ROLES.USER, value: INTERNAL_ROLES.USER }
              ))
            },
            { apply: (sub) => sub.addRoleOption(o => o.setName('rol_discord').setDescription('Rol de Discord a mapear').setRequired(true)) }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const internalRole = interaction.options.getString('rol_interno', true)
            const discordRole = interaction.options.getRole('rol_discord', true)

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
            current.add(discordRole.id)
            mappings.set(internalRole, [...current])
            guildData.internalRoleMappings = mappings
            await guildData.save()

            const e = okEmbed({
              ui,
              system: 'security',
              title: `${Emojis.success} Mapeo agregado`,
              lines: [
                `${Emojis.dot} **Rol Discord:** <@&${discordRole.id}>`,
                `${Emojis.dot} **Rol interno:** ${Format.inlineCode(internalRole)}`
              ]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        },
        {
          name: 'remove',
          description: 'Quita un rol de Discord del mapeo',
          options: [
            {
              apply: (sub) => sub.addStringOption(o => o.setName('rol_interno').setDescription('Rol interno').setRequired(true).addChoices(
                { name: INTERNAL_ROLES.ADMIN, value: INTERNAL_ROLES.ADMIN },
                { name: INTERNAL_ROLES.MOD, value: INTERNAL_ROLES.MOD },
                { name: INTERNAL_ROLES.USER, value: INTERNAL_ROLES.USER }
              ))
            },
            { apply: (sub) => sub.addRoleOption(o => o.setName('rol_discord').setDescription('Rol de Discord a desmapear').setRequired(true)) }
          ],
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const internalRole = interaction.options.getString('rol_interno', true)
            const discordRole = interaction.options.getRole('rol_discord', true)

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
            current.delete(discordRole.id)
            mappings.set(internalRole, [...current])
            guildData.internalRoleMappings = mappings
            await guildData.save()

            const e = okEmbed({
              ui,
              system: 'security',
              title: `${Emojis.success} Mapeo quitado`,
              lines: [
                `${Emojis.dot} **Rol Discord:** <@&${discordRole.id}>`,
                `${Emojis.dot} **Rol interno:** ${Format.inlineCode(internalRole)}`
              ]
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Muestra el mapeo actual de roles',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction) => {
            const ui = await getGuildUiConfig(client, interaction.guild.id)
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const lines = []
            for (const role of [INTERNAL_ROLES.ADMIN, INTERNAL_ROLES.MOD, INTERNAL_ROLES.USER]) {
              const ids = Array.isArray(mappings.get(role)) ? mappings.get(role) : []
              const pretty = ids.length ? ids.map(id => `<@&${id}>`).join(', ') : Format.italic('Sin mapeos')
              lines.push(`${Emojis.dot} ${Format.bold(role)}: ${pretty}`)
            }

            const e = embed({
              ui,
              system: 'security',
              kind: 'info',
              title: `${Emojis.security} Mapeo de roles`,
              description: [headerLine(Emojis.security, 'Discord → interno'), lines.join('\n')].join('\n')
            })
            return interaction.reply({ embeds: [e], ephemeral: true })
          }
        }
      ]
    }
  ]
})
