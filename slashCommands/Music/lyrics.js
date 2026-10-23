const { runLyrics } = require('../../handlers/music/lyrics-command')
module.exports = {
  name: 'lyrics',
  description: 'Muestra la letra de la canción actual o de una búsqueda',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    {
      String: {
        name: 'cancion',
        description: 'Nombre de la canción (vacío = canción actual)',
        required: false,
      },
    },
  ],
  run: async (client, interaction) => {
    await interaction.deferReply()
    return runLyrics(client, interaction, interaction.options.getString('cancion') || '')
  },
}
