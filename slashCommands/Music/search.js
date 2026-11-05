const { searchCatalogPicker } = require("../../bot/modulos/musica/comandos/buscar")
const { localeFor } = require('../../handlers/i18n')
// /music search estilo Soundy: pestañas 🎵 Pistas / 💿 Álbumes + menú para elegir.
const { err } = require("../../bot/modulos/musica/vistas/catalogo")

module.exports = {
  name: 'search',
  description: 'Busca canciones y álbumes y elige cuál reproducir',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    { String: { name: 'what_song', description: 'Canción o artista a buscar', required: true } },
  ],

  run: async (client, interaction) => {
    const query = interaction.options.getString('what_song').trim()
    if (!client.music) return interaction.reply({ embeds: [err('Sistema de música no disponible.')], ephemeral: true })

    await interaction.deferReply()
    return searchCatalogPicker({ client, query, actor: interaction.user, guild: interaction.guild,
      channelId: interaction.channelId, prefix: 'srch', locale: localeFor(client, interaction.guild.id),
      commandName: 'search', edit: payload => interaction.editReply(payload) })

  },
}
