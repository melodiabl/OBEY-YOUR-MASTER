const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce musica en tu canal de voz (YouTube / Spotify)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enlace o busqueda')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const query = interaction.options.getString('query', true).trim()
    if (isSoundCloudUrl(query)) {
      return interaction.reply({ content: 'SoundCloud no esta soportado en este bot. Usa YouTube o Spotify.', ephemeral: true })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return interaction.reply({ content: 'No tengo permisos para unirme o hablar en ese canal de voz.', ephemeral: true })
    }

    await interaction.deferReply()

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      const res = await music.play({
        guildId: interaction.guild.id,
        guild: interaction.guild,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      if (res.started) {
        return interaction.editReply(`Ahora: **${res.track.title}**`)
      }

      return interaction.editReply(`Agregado a la cola: **${res.track.title}**`)
    } catch (e) {
      return interaction.editReply(`No pude procesar tu solicitud: ${e?.message || e}`)
    }
  }
}
