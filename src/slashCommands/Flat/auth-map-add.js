const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { ensureMap } = require('../../utils/interactionUtils')

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.AUTH_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('auth-map-add')
    .setDescription('Mapea un rol de Discord a un rol interno (opcional)')
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
    ),

  async execute (client, interaction) {
    const internalRole = interaction.options.getString('rol_interno', true)
    const discordRole = interaction.options.getRole('rol_discord', true)

    const guildData = await client.db.getGuildData(interaction.guild.id)
    const mappings = ensureMap(guildData.internalRoleMappings)
    const current = new Set(Array.isArray(mappings.get(internalRole)) ? mappings.get(internalRole) : [])
    current.add(discordRole.id)
    mappings.set(internalRole, [...current])
    guildData.internalRoleMappings = mappings
    await guildData.save()

    return interaction.reply({ content: `✅ Mapeado <@&${discordRole.id}> -> **${internalRole}**.`, ephemeral: true })
  }
}

