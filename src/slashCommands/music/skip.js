const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la cancion actual'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      const res = await music.skip({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        force: true
      })
      if (res.ended) {
        return replyOk(client, interaction, { system: 'music', title: 'Skip', lines: ['Canción saltada. La cola terminó.'] })
      }
      return replyOk(client, interaction, { system: 'music', title: 'Skip', lines: [`Ahora: ${Format.bold(res.skippedTo.title)}`] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude saltar la canción.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
