const { openMusicSlashSetup } = require('../../handlers/setup-music-resources')
module.exports = {
  name: 'setupmusic',
  description: 'Crea o elimina un canal de peticiones de música (estilo Soundy)',
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: 'Crear o eliminar el canal',
        required: false,
        choices: [['Crear', 'create'], ['Eliminar', 'delete']],
      },
    },
  ],
  run: (client, interaction) => openMusicSlashSetup(client, interaction),
}
