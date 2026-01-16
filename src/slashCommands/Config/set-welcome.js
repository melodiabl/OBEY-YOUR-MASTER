const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { authorizeInternal } = require('../../core/auth/authorize')

async function requireInternal ({ interaction }) {
  const identity = await resolveInternalIdentity({
    guildId: interaction.guild.id,
    userId: interaction.user.id,
    member: interaction.member
  })

  const authz = authorizeInternal({
    identity,
    requiredRole: INTERNAL_ROLES.ADMIN,
    requiredPerms: PERMS.CONFIG_MANAGE
  })

  if (!authz.ok) {
    await interaction.reply({ content: `❌ ${authz.reason}`, ephemeral: true })
    return null
  }

  return identity
}

module.exports = {
  MODULE: 'config',
  CMD: new SlashCommandBuilder()
    .setName('set-welcome')
    .setDescription('Configura el canal de bienvenidas (sin IDs hardcodeados)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de bienvenidas')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute (client, interaction) {
    if (!interaction.guild) return
    const identity = await requireInternal({ interaction })
    if (!identity) return

    const channel = interaction.options.getChannel('canal', true)
    const guildData = await client.db.getGuildData(interaction.guild.id)
    guildData.welcomeChannel = channel.id
    await guildData.save()

    return interaction.reply({ content: `✅ Canal de bienvenidas configurado en <#${channel.id}>.`, ephemeral: true })
  }
}
