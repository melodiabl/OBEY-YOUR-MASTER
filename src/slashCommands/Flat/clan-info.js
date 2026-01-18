const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getClanByUser } = require('../../systems').clans
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-info')
    .setDescription('Muestra info de tu clan (o del clan de otro usuario)')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario (opcional)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const u = interaction.options.getUser('usuario') || interaction.user
    const clan = await getClanByUser({ client, guildID: interaction.guild.id, userID: u.id })
    if (!clan) return interaction.reply({ content: 'No hay clan para ese usuario.', ephemeral: true })

    const embed = new EmbedBuilder()
      .setTitle(`Clan: ${clan.name}${clan.tag ? ` [${clan.tag}]` : ''}`)
      .setColor('Gold')
      .addFields(
        { name: 'Dueno', value: `<@${clan.ownerID}>`, inline: true },
        { name: 'Miembros', value: String((clan.memberIDs || []).length), inline: true },
        { name: 'Banco', value: String(clan.bank || 0), inline: true },
        { name: 'Motto', value: clan.motto || 'Sin motto' }
      )
      .setTimestamp()

    if (clan.bannerUrl) embed.setImage(clan.bannerUrl)
    return interaction.reply({ embeds: [embed], ephemeral: true })
  }
}
