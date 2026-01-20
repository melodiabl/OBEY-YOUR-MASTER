const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { formatDuration } = require('../../utils/timeFormat')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la canción que se está reproduciendo actualmente'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de música no está inicializado.`)

      const state = await music.nowPlaying({ guildId: interaction.guild.id })
      const current = state.currentTrack
      if (!current) return interaction.editReply(`${Emojis.error} No hay música reproduciéndose en este momento.`)

      const player = music.shoukaku.players.get(interaction.guild.id)
      const position = player ? player.position : 0

      const statusEmoji = state.isPaused ? Emojis.idle : Emojis.online
      const statusText = state.isPaused ? 'Pausado' : 'Reproduciendo'

      const embed = new EmbedBuilder()
        .setTitle(`${statusEmoji} ${statusText}`)
        .setDescription(Format.h3(`[${current.title}](${current.uri})`))
        .addFields(
          { name: `${Emojis.owner} Autor`, value: Format.inlineCode(current.author), inline: true },
          { name: `${Emojis.member} Pedido por`, value: `<@${current.requestedBy.id}>`, inline: true },
          { name: `${Emojis.loading} Tiempo`, value: Format.inlineCode(`${formatDuration(position)} / ${formatDuration(current.duration)}`), inline: false },
          { name: `${Emojis.stats} Progreso`, value: Format.progressBar(position, current.duration, 15), inline: false }
        )
        .setColor('Blurple')
        .setTimestamp()

      if (current.thumbnail) embed.setThumbnail(current.thumbnail)

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
