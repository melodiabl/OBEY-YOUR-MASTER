const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getClanByUser } = require('../../systems').clans
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-info')
    .setDescription('Muestra info de un clan')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario para ver su clan (opcional)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const u = interaction.options.getUser('usuario') || interaction.user
    const clan = await getClanByUser({ client, guildID: interaction.guild.id, userID: u.id })

    if (!clan) {
      return interaction.reply({
        content: `${Emojis.error} No se encontró un clan asociado a ${Format.bold(u.username)}.`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.clan} Clan: ${clan.name}${clan.tag ? ` [${clan.tag}]` : ''}`)
      .setColor('Gold')
      .setDescription(clan.motto ? Format.quote(clan.motto) : Format.italic('Sin lema del clan'))
      .addFields(
        {
          name: `${Emojis.owner} Líder`,
          value: `<@${clan.ownerID}>`,
          inline: true
        },
        {
          name: `${Emojis.member} Miembros`,
          value: Format.inlineCode((clan.memberIDs || []).length.toString()),
          inline: true
        },
        {
          name: `${Emojis.bank} Banco`,
          value: `${Emojis.money} ${Format.bold((clan.bank || 0).toLocaleString())}`,
          inline: true
        }
      )
      .setFooter({ text: `ID: ${clan._id || 'Desconocido'}` })
      .setTimestamp()

    if (clan.bannerUrl) embed.setImage(clan.bannerUrl)

    return interaction.reply({ embeds: [embed] })
  }
}
