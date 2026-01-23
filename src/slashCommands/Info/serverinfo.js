const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información detallada sobre el servidor'),
  async execute (client, interaction) {
    try {
      const { guild } = interaction
      const owner = await guild.fetchOwner()

      // Conteo de emojis
      const emojis = guild.emojis.cache
      const animatedEmojis = emojis.filter(e => e.animated).size
      const staticEmojis = emojis.size - animatedEmojis

      // Conteo de miembros
      const totalMembers = guild.memberCount
      const bots = guild.members.cache.filter(m => m.user.bot).size
      const humans = totalMembers - bots

      // Conteo de canales
      const channels = guild.channels.cache
      const textChannels = channels.filter(c => [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(c.type)).size
      const voiceChannels = channels.filter(c => [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type)).size
      const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.info} Información de ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
        .setColor('Blurple')
        .setDescription(guild.description ? Format.quote(guild.description) : null)
        .addFields(
          {
            name: `${Emojis.owner} Propietario`,
            value: `${owner.user.tag}\n${Format.subtext(owner.id)}`,
            inline: true
          },
          {
            name: `${Emojis.calendar} Creado el`,
            value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
            inline: true
          },
          {
            name: `${Emojis.id} Server ID`,
            value: Format.inlineCode(guild.id),
            inline: true
          },
          {
            name: `${Emojis.channel} Canales (${channels.size})`,
            value: `${Emojis.dot} ${Format.toBold('Texto:')} ${textChannels}\n${Emojis.dot} ${Format.toBold('Voz:')} ${voiceChannels}\n${Emojis.dot} ${Format.toBold('Categorías:')} ${categories}`,
            inline: true
          },
          {
            name: `${Emojis.member} Miembros (${totalMembers})`,
            value: `${Emojis.dot} ${Format.toBold('Humanos:')} ${humans}\n${Emojis.dot} ${Format.toBold('Bots:')} ${bots}`,
            inline: true
          },
          {
            name: `${Emojis.boost} Mejoras`,
            value: `${Emojis.dot} ${Format.toBold('Nivel:')} ${guild.premiumTier}\n${Emojis.dot} ${Format.toBold('Boosts:')} ${guild.premiumSubscriptionCount}`,
            inline: true
          },
          {
            name: `${Emojis.stats} Otros`,
            value: `${Emojis.dot} ${Format.toBold('Roles:')} ${guild.roles.cache.size}\n${Emojis.dot} ${Format.toBold('Emojis:')} ${emojis.size} (${animatedEmojis} anim.)\n${Emojis.dot} ${Format.toBold('Verificación:')} ${guild.verificationLevel}`,
            inline: true
          }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (err) {
      console.error(err)
      await interaction.reply({ content: `${Emojis.error} Ocurrió un error al obtener la información del servidor.`, ephemeral: true })
    }
  }
}
