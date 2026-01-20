const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla las canciones de la cola'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de musica no esta inicializado.`)

      const { count } = await music.shuffle({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id
      })

      if (count < 2) {
        return interaction.editReply(`${Emojis.error} No hay suficientes canciones en la cola para mezclar.`)
      }

      return interaction.editReply(`${Emojis.success} Se han mezclado ${Format.bold(count)} canciones.`)
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
