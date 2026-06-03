const { EmbedBuilder } = require('discord.js')
const User = require('../../database/schemas/UserSchema')
module.exports = {
  name: 'show',
  description: 'Ver las invitaciones de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar (por defecto: tú)', required: false } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario') || interaction.user
    const data = await User.findOne({ userId: target.id, guildId: interaction.guild.id })
    const invites = data?.invites || 0
    const fake = data?.fakeInvites || 0
    const left = data?.leftInvites || 0
    const effective = Math.max(0, invites - fake - left)
    const invitedBy = data?.invitedBy
    const inviterMention = invitedBy && invitedBy !== 'VANITY' ? `<@${invitedBy}>` : invitedBy === 'VANITY' ? 'URL vanity' : 'Desconocido'

    const embed = new EmbedBuilder()
      .setTitle(`📨 Invitaciones de ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor('#5865F2')
      .addFields(
        { name: '✅ Efectivas', value: `**${effective}**`, inline: true },
        { name: '📊 Totales', value: `**${invites}**`, inline: true },
        { name: '❌ Falsas', value: `**${fake}**`, inline: true },
        { name: '🚪 Que salieron', value: `**${left}**`, inline: true },
        { name: '🔗 Invitado por', value: inviterMention, inline: true },
      )
      .setTimestamp()
    await interaction.reply({ embeds: [embed], ephemeral: false })
  },
}
