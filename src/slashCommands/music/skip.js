const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la cancion actual'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de musica no esta inicializado.`)

      const res = await music.skip({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        force: true
      })
      if (res.ended) return interaction.editReply(`${Emojis.success} Cancion saltada. La cola termino.`)
      return interaction.editReply(`${Emojis.success} Cancion saltada. Ahora: ${Format.bold(res.skippedTo.title)}`)
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
