const { SlashCommandBuilder } = require('discord.js')
const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('auth-whoami')
    .setDescription('Muestra tu rol interno actual (OWNER/ADMIN/MOD/USER)'),

  async execute (client, interaction) {
    const identity = await resolveInternalIdentity({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      member: interaction.member
    })

    return interaction.reply({
      content: `Rol interno: **${identity.role}**\nGrants: **${identity.grants.length}** | Denies: **${identity.denies.length}**`,
      ephemeral: true
    })
  }
}

