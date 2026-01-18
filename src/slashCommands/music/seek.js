const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

function parseTimeToMs (timeStr) {
  if (!timeStr) return null
  if (/^\d+$/.test(timeStr)) return parseInt(timeStr) * 1000

  const parts = timeStr.split(':').reverse()
  let ms = 0
  if (parts[0]) ms += parseInt(parts[0]) * 1000
  if (parts[1]) ms += parseInt(parts[1]) * 60 * 1000
  if (parts[2]) ms += parseInt(parts[2]) * 60 * 60 * 1000
  return ms
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('seek')
    .setDescription('Salta a un punto específico de la canción')
    .addStringOption(option =>
      option
        .setName('tiempo')
        .setDescription('Punto al que saltar (ej: 1:30 o 90)')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const timeStr = interaction.options.getString('tiempo', true)
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    const ms = parseTimeToMs(timeStr)
    if (isNaN(ms) || ms === null) {
      return interaction.editReply('Formato de tiempo inválido. Usa segundos (90) o formato 1:30.')
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      const state = await music.nowPlaying({ guildId: interaction.guild.id })
      if (!state.currentTrack) {
        return interaction.editReply('No hay ninguna canción reproduciéndose.')
      }

      if (ms > state.currentTrack.duration) {
        return interaction.editReply('❌ El tiempo especificado excede la duración de la canción.')
      }

      await music.seek({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        position: ms
      })

      return interaction.editReply(`⏩ Saltado a **${timeStr}**`)
    } catch (e) {
      return interaction.editReply(`Error: ${e?.message || e}`)
    }
  }
}
