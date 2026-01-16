const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { resolveInternalIdentity, invalidateIdentityCache } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { authorizeInternal } = require('../../core/auth/authorize')

function roleChoices () {
  return INTERNAL_ROLE_ORDER
    .filter(r => r !== INTERNAL_ROLES.OWNER) // OWNER se gestiona por OWNER_IDS en .env
    .map(r => ({ name: r, value: r }))
}

async function requireInternal ({ interaction, requiredRole, requiredPerms }) {
  const identity = await resolveInternalIdentity({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    member: interaction.member
  })

  const authz = authorizeInternal({ identity, requiredRole, requiredPerms })
  if (!authz.ok) {
    await interaction.reply({ content: `❌ ${authz.reason}`, ephemeral: true })
    return null
  }
  return identity
}

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

module.exports = {
  MODULE: 'auth',
  CMD: new SlashCommandBuilder()
    .setName('auth')
    .setDescription('Sistema interno de roles/permisos (OWNER/ADMIN/MOD/USER)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sc =>
      sc
        .setName('whoami')
        .setDescription('Muestra tu rol interno actual')
    )
    .addSubcommandGroup(g =>
      g
        .setName('role')
        .setDescription('Gestiona roles internos por usuario')
        .addSubcommand(sc =>
          sc
            .setName('set')
            .setDescription('Asigna un rol interno a un usuario (override)')
            .addUserOption(o =>
              o
                .setName('usuario')
                .setDescription('Usuario a modificar')
                .setRequired(true)
            )
            .addStringOption(o =>
              o
                .setName('rol')
                .setDescription('Rol interno')
                .setRequired(true)
                .addChoices(...roleChoices())
            )
        )
        .addSubcommand(sc =>
          sc
            .setName('clear')
            .setDescription('Elimina el override de rol interno de un usuario')
            .addUserOption(o =>
              o
                .setName('usuario')
                .setDescription('Usuario a modificar')
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(g =>
      g
        .setName('map')
        .setDescription('Mapea roles de Discord -> roles internos (opcional)')
        .addSubcommand(sc =>
          sc
            .setName('add')
            .setDescription('Agrega un rol de Discord al mapeo')
            .addStringOption(o =>
              o
                .setName('rol_interno')
                .setDescription('Rol interno destino')
                .setRequired(true)
                .addChoices(
                  { name: INTERNAL_ROLES.ADMIN, value: INTERNAL_ROLES.ADMIN },
                  { name: INTERNAL_ROLES.MOD, value: INTERNAL_ROLES.MOD },
                  { name: INTERNAL_ROLES.USER, value: INTERNAL_ROLES.USER }
                )
            )
            .addRoleOption(o =>
              o
                .setName('rol_discord')
                .setDescription('Rol de Discord a mapear')
                .setRequired(true)
            )
        )
        .addSubcommand(sc =>
          sc
            .setName('remove')
            .setDescription('Quita un rol de Discord del mapeo')
            .addStringOption(o =>
              o
                .setName('rol_interno')
                .setDescription('Rol interno')
                .setRequired(true)
                .addChoices(
                  { name: INTERNAL_ROLES.ADMIN, value: INTERNAL_ROLES.ADMIN },
                  { name: INTERNAL_ROLES.MOD, value: INTERNAL_ROLES.MOD },
                  { name: INTERNAL_ROLES.USER, value: INTERNAL_ROLES.USER }
                )
            )
            .addRoleOption(o =>
              o
                .setName('rol_discord')
                .setDescription('Rol de Discord a desmapear')
                .setRequired(true)
            )
        )
        .addSubcommand(sc =>
          sc
            .setName('list')
            .setDescription('Muestra el mapeo actual')
        )
    ),

  async execute (client, interaction) {
    if (!interaction.guild) return

    const subGroup = interaction.options.getSubcommandGroup(false)
    const sub = interaction.options.getSubcommand()

    if (!subGroup && sub === 'whoami') {
      const identity = await resolveInternalIdentity({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        member: interaction.member
      })

      return interaction.reply({
        content: `Tu rol interno es **${identity.role}**.\nGrants: **${identity.grants.length}** | Denies: **${identity.denies.length}**`,
        ephemeral: true
      })
    }

    // Gestión sensible: requiere sistema interno (no depender solo de Discord).
    const identity = await requireInternal({
      interaction,
      requiredRole: INTERNAL_ROLES.ADMIN,
      requiredPerms: PERMS.AUTH_MANAGE
    })
    if (!identity) return

    if (subGroup === 'role' && sub === 'set') {
      const target = interaction.options.getUser('usuario', true)
      const role = interaction.options.getString('rol', true)
      if (!isValidInternalRole(role) || role === INTERNAL_ROLES.OWNER) {
        return interaction.reply({ content: '❌ Rol interno inválido.', ephemeral: true })
      }

      await MemberAuthSchema.findOneAndUpdate(
        { guildID: interaction.guild.id, userID: target.id },
        { $set: { role } },
        { upsert: true, new: true }
      )

      invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
      return interaction.reply({ content: `✅ Rol interno de <@${target.id}> actualizado a **${role}**.`, ephemeral: true })
    }

    if (subGroup === 'role' && sub === 'clear') {
      const target = interaction.options.getUser('usuario', true)
      await MemberAuthSchema.findOneAndUpdate(
        { guildID: interaction.guild.id, userID: target.id },
        { $set: { role: null } },
        { upsert: true, new: true }
      )

      invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
      return interaction.reply({ content: `✅ Override de rol interno eliminado para <@${target.id}>.`, ephemeral: true })
    }

    if (subGroup === 'map' && sub === 'add') {
      const internalRole = interaction.options.getString('rol_interno', true)
      const discordRole = interaction.options.getRole('rol_discord', true)

      const guildData = await client.db.getGuildData(interaction.guild.id)
      const mappings = normalizeMap(guildData.internalRoleMappings)
      const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
      current.add(discordRole.id)
      mappings.set(internalRole, [...current])
      guildData.internalRoleMappings = mappings
      await guildData.save()

      return interaction.reply({ content: `✅ Mapeado <@&${discordRole.id}> -> **${internalRole}**.`, ephemeral: true })
    }

    if (subGroup === 'map' && sub === 'remove') {
      const internalRole = interaction.options.getString('rol_interno', true)
      const discordRole = interaction.options.getRole('rol_discord', true)

      const guildData = await client.db.getGuildData(interaction.guild.id)
      const mappings = normalizeMap(guildData.internalRoleMappings)
      const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
      current.delete(discordRole.id)
      mappings.set(internalRole, [...current])
      guildData.internalRoleMappings = mappings
      await guildData.save()

      return interaction.reply({ content: `✅ Quitado <@&${discordRole.id}> del mapeo de **${internalRole}**.`, ephemeral: true })
    }

    if (subGroup === 'map' && sub === 'list') {
      const guildData = await client.db.getGuildData(interaction.guild.id)
      const mappings = normalizeMap(guildData.internalRoleMappings)
      const lines = []
      for (const role of [INTERNAL_ROLES.ADMIN, INTERNAL_ROLES.MOD, INTERNAL_ROLES.USER]) {
        const ids = Array.isArray(mappings.get(role)) ? mappings.get(role) : []
        const pretty = ids.length ? ids.map(id => `<@&${id}>`).join(', ') : '*Sin mapeos*'
        lines.push(`**${role}**: ${pretty}`)
      }

      return interaction.reply({ content: lines.join('\n'), ephemeral: true })
    }

    return interaction.reply({ content: '❌ Subcomando no reconocido.', ephemeral: true })
  }
}
