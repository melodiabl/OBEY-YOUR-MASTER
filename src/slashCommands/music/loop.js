const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Configura el modo de repetición')
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(true)
        .addChoices(
          { name: 'Desactivado', value: 'none' },
          { name: 'Canción Actual', value: 'track' },
          { name: 'Cola Completa', value: 'queue' }
        )
    ),
  DEFER: true,
  async execute (client, interaction) {
    const mode = interaction.options.getString('modo', true)
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      await music.setLoop({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        mode
      })

      const modeLabels = {
        none: 'Desactivado',
        track: 'Canción actual',
        queue: 'Cola completa'
      }

      return replyOk(client, interaction, {
        system: 'music',
        title: 'Loop actualizado',
        lines: [`Modo: ${Format.bold(modeLabels[mode] || mode)}`]
      })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude actualizar el loop.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
