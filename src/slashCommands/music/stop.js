const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la musica y limpia la cola'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de musica no esta inicializado.`)

      await music.stop({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      return interaction.editReply(`${Emojis.offline} Musica detenida y cola borrada.`)
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
