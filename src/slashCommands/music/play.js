const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')
const { formatDuration } = require('../../utils/timeFormat')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música en tu canal de voz (YouTube / Spotify)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enlace o búsqueda de la canción')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const query = interaction.options.getString('query', true).trim()
    if (isSoundCloudUrl(query)) {
      return interaction.editReply({ content: `${Emojis.error} SoundCloud no está soportado. Usa YouTube o Spotify.` })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return interaction.editReply({ content: `${Emojis.error} No tengo permisos para unirme o hablar en ese canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de música no está inicializado.`)

      const res = await music.play({
        guildId: interaction.guild.id,
        guild: interaction.guild,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      if (res.isPlaylist) {
        const embed = new EmbedBuilder()
          .setTitle(`${Emojis.music} Lista de reproducción agregada`)
          .setDescription(`Se han agregado ${Format.bold(res.trackCount)} canciones de la lista ${Format.inlineCode(res.playlistName || 'Desconocida')}`)
          .setColor('Blurple')
          .setTimestamp()
        return interaction.editReply({ embeds: [embed] })
      }

      const { track } = res
      const embed = new EmbedBuilder()
        .setTitle(res.started ? `${Emojis.success} Reproduciendo ahora` : `${Emojis.music} Agregado a la cola`)
        .setDescription(Format.h3(`[${track.title}](${track.uri})`))
        .addFields(
          { name: `${Emojis.owner} Autor`, value: Format.inlineCode(track.author), inline: true },
          { name: `${Emojis.loading} Duración`, value: Format.inlineCode(formatDuration(track.duration)), inline: true },
          { name: `${Emojis.member} Pedido por`, value: `<@${track.requestedBy.id}>`, inline: true }
        )
        .setColor(res.started ? 'Green' : 'Yellow')
        .setTimestamp()

      if (track.thumbnail) embed.setThumbnail(track.thumbnail)

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`${Emojis.error} No pude procesar tu solicitud: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
