const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { requireClanByUser } = require('../../systems').clans
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-members')
    .setDescription('Lista los miembros de tu clan'),

  async execute (client, interaction) {
    try {
      const clan = await requireClanByUser({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      const ids = Array.isArray(clan.memberIDs) ? clan.memberIDs : []

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.member} Miembros de: ${clan.name}`)
        .setColor('Blue')
        .setDescription(Format.subtext(`Total de miembros: ${Format.bold(ids.length.toString())}`))
        .setTimestamp()

      const memberList = ids.slice(0, 30).map(id => `${Emojis.dot} <@${id}>`).join('\n')

      embed.addFields({
        name: `Lista de Miembros${ids.length > 30 ? ' (Primeros 30)' : ''}`,
        value: memberList || 'No hay miembros.'
      })

      if (ids.length > 30) {
        embed.setFooter({ text: `Y ${ids.length - 30} miembros más...` })
      }

      return interaction.reply({ embeds: [embed], ephemeral: true })
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
