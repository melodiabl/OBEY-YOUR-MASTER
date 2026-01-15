const playdl = require('play-dl');
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
      let song;
      const validation = await playdl.validate(query);
      
      if (validation === 'video') {
        const info = await playdl.video_info(query);
        song = { url: query, title: info.video_details.title };
      } else {
        const result = await playdl.search(query, { limit: 1 });
        const video = result[0];
        if (!video) {
          return message.reply('No encontré resultados.');
        }
        song = { url: video.url, title: video.title };
      }
      
      if (!song.url) {
        return message.reply('❌ No se pudo obtener una URL válida para esta canción.');
      }

      await musicManager.addSong(message.guild, song, voiceChannel, message.channel);
    } catch (error) {
      console.error(error);
      message.reply('❌ Hubo un error al intentar procesar la canción.');
    }
  },
};
