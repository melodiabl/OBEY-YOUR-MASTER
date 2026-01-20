const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Limpia la cola de canciones (mantiene la actual)'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de musica no esta inicializado.`)

      const { cleared, state } = await music.clearQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
      return interaction.editReply(`${Emojis.success} Cola limpiada: ${Format.bold(cleared)} canciones eliminadas${suffix}.`)
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
