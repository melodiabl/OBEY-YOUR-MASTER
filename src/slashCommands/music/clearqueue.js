const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Limpia la cola de canciones (mantiene la actual)'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      const { cleared, state } = await music.clearQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
      return replyOk(client, interaction, {
        system: 'music',
        title: 'Cola limpiada',
        lines: [`Canciones eliminadas: ${Format.bold(cleared)}${suffix}.`]
      })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude limpiar la cola.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
