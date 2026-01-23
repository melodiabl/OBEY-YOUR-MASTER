const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla las canciones de la cola'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de musica no esta inicializado.' })

      const { count } = await music.shuffle({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id
      })

      if (count < 2) {
        return replyWarn(client, interaction, { system: 'music', title: 'Nada para mezclar', lines: ['No hay suficientes canciones en la cola para mezclar.'] })
      }

      return replyOk(client, interaction, { system: 'music', title: 'Mezclado', lines: [`Se han mezclado ${Format.bold(count)} canciones.`] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude mezclar la cola.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
