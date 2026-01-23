const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { formatDuration } = require('../../utils/timeFormat')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de música no está inicializado.' })

      const state = await music.getQueue({ guildId: interaction.guild.id })
      const current = state.currentTrack
      const upcoming = state.queue

      if (!current && upcoming.length === 0) {
        return replyWarn(client, interaction, { system: 'music', title: 'Cola vacía', lines: ['No hay canciones en la cola.'] })
      }

      const loopEmoji = { none: Emojis.arrow, track: '🔂', queue: '🔁' }
      const loopLabel = { none: 'Desactivado', track: 'Canción', queue: 'Cola' }

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.music} Cola de Reproducción`)
        .setColor('Blurple')
        .setTimestamp()

      let description = ''
      if (current) {
        description += `${Format.bold('Ahora reproduciendo:')}\n${Emojis.online} [${current.title}](${current.uri}) | ${Format.inlineCode(formatDuration(current.duration))}\n\n`
      }

      if (upcoming.length > 0) {
        description += `${Format.bold('Siguientes en la cola:')}\n`
        description += upcoming.slice(0, 10).map((t, i) => `${Format.inlineCode((i + 1).toString())}. [${t.title}](${t.uri}) | ${Format.inlineCode(formatDuration(t.duration))}`).join('\n')

        if (upcoming.length > 10) {
          description += `\n\n${Format.italic(`... y ${upcoming.length - 10} canciones más.`)}`
        }
      } else {
        description += Format.italic('No hay canciones siguientes.')
      }

      embed.setDescription(description)
      embed.addFields(
        { name: `${Emojis.voice} Volumen`, value: Format.inlineCode(`${state.volume}%`), inline: true },
        { name: `${loopEmoji[state.loop]} Bucle`, value: Format.inlineCode(loopLabel[state.loop]), inline: true },
        { name: `${Emojis.member} Total`, value: Format.inlineCode((upcoming.length + (current ? 1 : 0)).toString()), inline: true }
      )

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude obtener la cola.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
