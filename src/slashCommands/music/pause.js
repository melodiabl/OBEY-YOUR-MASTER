const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la musica'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      await music.pause({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      return replyOk(client, interaction, { system: 'music', title: 'Pausado', lines: ['Música pausada.'] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude pausar la música.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
