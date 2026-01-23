const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')

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
  REGISTER: true,
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
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    const ms = parseTimeToMs(timeStr)
    if (isNaN(ms) || ms === null) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'Formato de tiempo inválido.',
        hint: 'Usa segundos (90) o formato 1:30.'
      })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      const state = await music.nowPlaying({ guildId: interaction.guild.id })
      if (!state.currentTrack) {
        return replyWarn(client, interaction, { system: 'music', title: 'Sin reproducción', lines: ['No hay ninguna canción reproduciéndose.'] })
      }

      if (ms > state.currentTrack.duration) {
        return replyError(client, interaction, {
          system: 'music',
          reason: 'El tiempo especificado excede la duración de la canción.'
        })
      }

      await music.seek({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        position: ms
      })

      return replyOk(client, interaction, { system: 'music', title: 'Seek', lines: [`Saltado a ${Format.bold(timeStr)}`] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude hacer seek.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
