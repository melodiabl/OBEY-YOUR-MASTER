const { openMusicSetup } = require('../../handlers/setup-music-resources')
module.exports = {
  name: 'setupmusic',
  category: 'Music',
  aliases: ['setup-music', 'musicsetup', 'canalmusica'],
  description: 'Crea o elimina un canal de peticiones de música (estilo Soundy)',
  usage: 'setupmusic [create|delete]',
  run: (client, message, args = []) => openMusicSetup(client, message, args[0] || ""),
}
