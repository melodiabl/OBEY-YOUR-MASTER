const { searchCatalogPicker } = require("../../bot/modulos/musica/comandos/buscar")
const { localeFor } = require('../../handlers/i18n')
// /music play estilo Soundy: muestra resultados (🎵 Pistas / 💿 Álbumes) para elegir; URL directa.
const { EmbedBuilder } = require('discord.js')
const { config } = require('../../handlers/music/config')
const { err, addedEmbed, playlistAdded } = require("../../bot/modulos/musica/vistas/catalogo")

const isUrl = s => /^https?:\/\//i.test(s)

module.exports = {
  name: 'play',
  description: 'Busca y reproduce una canción, álbum, playlist o URL',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    { String: { name: 'what_song', description: 'Canción, artista o URL de Spotify/YouTube', required: true } },
  ],

  run: async (client, interaction) => {
    const query = interaction.options.getString('what_song').trim()
    const voiceChannel = interaction.member?.voice?.channel
    if (!voiceChannel) return interaction.reply({ embeds: [err('Debes estar en un canal de voz.')], ephemeral: true })
    if (!client.music) return interaction.reply({ embeds: [err('Sistema de música no disponible.')], ephemeral: true })

    await interaction.deferReply()

    // URL directa
    if (isUrl(query)) {
      const result = await client.music.search(query, interaction.user, { guildId: interaction.guildId }).catch(() => null)
      if (!result?.tracks?.length) return interaction.editReply({ embeds: [err('No encontré resultados para esa URL.')] }).catch(() => {})
      try {
        const player = await client.music.joinChannel(interaction.guild.id, voiceChannel.id, interaction.channelId)
        const state  = client.music.getState(interaction.guild.id)
        if (result.loadType === 'playlist' && result.tracks.length > 1) {
          await client.music.enqueue(interaction.guild.id, result.tracks)
          return interaction.editReply({ embeds: [playlistAdded(result, query, interaction.user.id, localeFor(client, interaction.guild.id))] }).catch(() => {})
        }
        const track = result.tracks[0]
        const wasEmpty = !state.currentTrack
        await client.music.enqueue(interaction.guild.id, [track])
        return interaction.editReply({ embeds: [addedEmbed(track.info || track, { isNow: wasEmpty, added: 1 }, interaction.user.id, localeFor(client, interaction.guild.id))] }).catch(() => {})
      } catch (e) {
        return interaction.editReply({ embeds: [err(e.message || String(e))] }).catch(() => {})
      }
    }

    // Nombre → picker con pestañas
    return searchCatalogPicker({ client, query, actor: interaction.user, guild: interaction.guild,
      channelId: interaction.channelId, prefix: 'pplay', locale: localeFor(client, interaction.guild.id),
      commandName: 'play', edit: payload => interaction.editReply(payload) })

  },
}
