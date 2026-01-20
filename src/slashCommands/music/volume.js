const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen del bot')
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription('Nivel de volumen (0-100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const volume = interaction.options.getInteger('cantidad', true)
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: `${Emojis.error} Debes estar en un canal de voz.` })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply(`${Emojis.error} El sistema de música no está inicializado.`)

      await music.setVolume({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        volume
      })

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.voice} Volumen Actualizado`)
        .setDescription(`El volumen se ha ajustado al ${Format.bold(`${volume}%`)}.`)
        .setColor('Blurple')
        .addFields({ name: 'Progreso', value: Format.progressBar(volume, 100, 15) })
        .setTimestamp()

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`${Emojis.error} Error: ${Format.inlineCode(e?.message || e)}`)
    }
  }
}
