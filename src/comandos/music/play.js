const musicManager = require('../../music/musicManager');

module.exports = {
  DESCRIPTION: 'Reproduce música en tu canal de voz. Soporta YouTube, Spotify y Soundcloud.',
  ALIASES: ['p'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute(client, message, args, prefix) {
    const voiceChannel = message.member.voice?.channel;
    if (!voiceChannel) {
      return message.reply('❌ Debes unirte a un canal de voz para reproducir música.');
    }

    const query = args.join(' ');
    if (!query) {
      return message.reply('Debes proporcionar un enlace o búsqueda.');
    }

    try {
      // El nuevo musicManager usa Lavalink Local para buscar y reproducir
      await musicManager.addSong(message.guild, query, voiceChannel, message.channel, message.author);
    } catch (error) {
      console.error('Error en comando play:', error);
      message.reply('❌ Hubo un error al intentar procesar la canción con Lavalink Local.');
    }
  },
};
