const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { invalidateIdentityCache } = require('../../core/auth/resolveInternalIdentity')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

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
        return interaction.reply({
          content: [
            `${Emojis.learning} **Identidad interna**`,
            Format.divider(18),
            `${Emojis.human} **Rol:** ${Format.inlineCode(identity.role)}`,
            `${Emojis.success} **Grants:** ${Format.inlineCode(identity.grants.length)}  ${Emojis.dot}  ${Emojis.error} **Denies:** ${Format.inlineCode(identity.denies.length)}`
          ].join('\n'),
          ephemeral: true
        })
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
            const target = interaction.options.getUser('usuario', true)
            const role = interaction.options.getString('rol', true)

            if (!isValidInternalRole(role) || role === INTERNAL_ROLES.OWNER) {
              return interaction.reply({ content: `${Emojis.error} Rol interno inválido.`, ephemeral: true })
            }
            if (role === INTERNAL_ROLES.CREATOR && !canTouchCreator(identity)) {
              return interaction.reply({ content: `${Emojis.error} Solo **OWNER/CREATOR** puede asignar **CREATOR**.`, ephemeral: true })
            }

            await MemberAuthSchema.findOneAndUpdate(
              { guildID: interaction.guild.id, userID: target.id },
              { $set: { role } },
              { upsert: true, new: true }
            )

            invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
            return interaction.reply({ content: `${Emojis.success} Rol interno de <@${target.id}> → **${role}**.`, ephemeral: true })
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
            const target = interaction.options.getUser('usuario', true)

            try {
              const existing = await MemberAuthSchema.findOne({ guildID: interaction.guild.id, userID: target.id })
              if (existing?.role === INTERNAL_ROLES.CREATOR && !canTouchCreator(identity)) {
                return interaction.reply({ content: `${Emojis.error} Solo **OWNER/CREATOR** puede modificar overrides de **CREATOR**.`, ephemeral: true })
              }
            } catch (e) {}

            await MemberAuthSchema.findOneAndUpdate(
              { guildID: interaction.guild.id, userID: target.id },
              { $set: { role: null } },
              { upsert: true, new: true }
            )

            invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
            return interaction.reply({ content: `${Emojis.success} Override eliminado para <@${target.id}>.`, ephemeral: true })
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
            const internalRole = interaction.options.getString('rol_interno', true)
            const discordRole = interaction.options.getRole('rol_discord', true)

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
            current.add(discordRole.id)
            mappings.set(internalRole, [...current])
            guildData.internalRoleMappings = mappings
            await guildData.save()

            return interaction.reply({ content: `${Emojis.success} Mapeado <@&${discordRole.id}> → **${internalRole}**.`, ephemeral: true })
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
            const internalRole = interaction.options.getString('rol_interno', true)
            const discordRole = interaction.options.getRole('rol_discord', true)

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
            current.delete(discordRole.id)
            mappings.set(internalRole, [...current])
            guildData.internalRoleMappings = mappings
            await guildData.save()

            return interaction.reply({ content: `${Emojis.success} Quitado <@&${discordRole.id}> del mapeo de **${internalRole}**.`, ephemeral: true })
          }
        },
        {
          name: 'list',
          description: 'Muestra el mapeo actual de roles',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.AUTH_MANAGE] },
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const mappings = ensureMap(guildData.internalRoleMappings)
            const lines = []
            for (const role of [INTERNAL_ROLES.ADMIN, INTERNAL_ROLES.MOD, INTERNAL_ROLES.USER]) {
              const ids = Array.isArray(mappings.get(role)) ? mappings.get(role) : []
              const pretty = ids.length ? ids.map(id => `<@&${id}>`).join(', ') : '*Sin mapeos*'
              lines.push(`${Emojis.dot} **${role}**: ${pretty}`)
            }
            return interaction.reply({ content: lines.join('\n'), ephemeral: true })
          }
        }
      ]
    }
  ]
})
