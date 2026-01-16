const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { ensureMap } = require('../../utils/interactionUtils')

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.AUTH_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('auth-map-list')
    .setDescription('Muestra el mapeo actual de roles Discord -> roles internos'),

  async execute (client, interaction) {
    const guildData = await client.db.getGuildData(interaction.guild.id)
    const mappings = ensureMap(guildData.internalRoleMappings)
    const lines = []
    for (const role of [INTERNAL_ROLES.ADMIN, INTERNAL_ROLES.MOD, INTERNAL_ROLES.USER]) {
      const ids = Array.isArray(mappings.get(role)) ? mappings.get(role) : []
      const pretty = ids.length ? ids.map(id => `<@&${id}>`).join(', ') : '*Sin mapeos*'
      lines.push(`**${role}**: ${pretty}`)
    }

    return interaction.reply({ content: lines.join('\n'), ephemeral: true })
  }
}

