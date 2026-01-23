const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información detallada sobre un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario del que quieres ver la información')
        .setRequired(false)),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const member = await interaction.guild.members.fetch(user.id)

    const roles = member.roles.cache
      .filter(role => role.name !== '@everyone')
      .map(role => role.toString())
      .join(', ') || 'Ninguno'

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.info} Información de ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setColor(member.displayHexColor || '#2b2d31')
      .addFields(
        {
          name: `${Emojis.human} ${Format.toBold('USUARIO')}`,
          value: [
            `${Emojis.dot} ${Format.toBold('Tag:')} ${user.tag}`,
            `${Emojis.dot} ${Format.toBold('ID:')} ${user.id}`,
            `${Emojis.dot} ${Format.toBold('Bot:')} ${user.bot ? 'Sí' : 'No'}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.calendar} ${Format.toBold('FECHAS')}`,
          value: [
            `${Emojis.dot} ${Format.toBold('Cuenta Creada:')} <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            `${Emojis.dot} ${Format.toBold('Unido al Server:')} <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.role} ${Format.toBold('ROLES')}`,
          value: roles,
          inline: false
        }
      )
      .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
