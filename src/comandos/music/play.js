const yts = require('yt-search');
const musicManager = require('../../music/musicManager');

module.exports = {
  DESCRIPTION: 'Reproduce música en tu canal de voz. Acepta URL o términos de búsqueda.',
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
      // Usamos yt-search para obtener la información de forma estable
      const r = await yts(query);
      const video = r.videos[0];

      if (!video) {
        return message.reply('❌ No encontré resultados para tu búsqueda.');
      }

      // Construimos el objeto song correctamente para el musicManager local
      const song = { 
        url: video.url, 
        title: video.title,
        duration: video.timestamp,
        thumbnail: video.thumbnail
      };

      await musicManager.addSong(message.guild, song, voiceChannel, message.channel);
    } catch (error) {
      console.error('Error en comando play:', error);
      message.reply('❌ Hubo un error al intentar procesar la canción.');
    }
  },
};
