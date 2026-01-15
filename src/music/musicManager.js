const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const play = require('play-dl');
const yts = require('yt-search');

// Mapa para mantener las colas por servidor
const queues = new Map();

async function addSong(guild, song, voiceChannel, textChannel) {
  let queue = queues.get(guild.id);

  if (!queue) {
    queue = {
      textChannel,
      voiceChannel,
      connection: null,
      player: createAudioPlayer(),
      songs: [],
      playing: true
    };
    queues.set(guild.id, queue);
    queue.songs.push(song);

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
      });

      queue.connection = connection;

      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      } catch (error) {
        connection.destroy();
        queues.delete(guild.id);
        return textChannel.send('❌ No se pudo conectar al canal de voz.');
      }

      connection.subscribe(queue.player);
      
      setupPlayerEvents(guild.id);
      playSong(guild.id);

    } catch (error) {
      console.error('Error al iniciar la música:', error);
      queues.delete(guild.id);
      textChannel.send('❌ Hubo un error al intentar unirse al canal.');
    }
  } else {
    queue.songs.push(song);
    return textChannel.send(`✅ **${song.title}** añadida a la cola.`);
  }
}

function setupPlayerEvents(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  queue.player.on(AudioPlayerStatus.Idle, () => {
    queue.songs.shift();
    if (queue.songs.length > 0) {
      playSong(guildId);
    } else {
      setTimeout(() => {
        const currentQueue = queues.get(guildId);
        if (currentQueue && currentQueue.songs.length === 0) {
          if (currentQueue.connection) currentQueue.connection.destroy();
          queues.delete(guildId);
        }
      }, 30_000);
    }
  });

  queue.player.on('error', error => {
    console.error(`Error en el reproductor:`, error);
    queue.songs.shift();
    playSong(guildId);
  });
}

/**
 * Reproducción usando play-dl con configuración de bypass.
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    console.log(`[Music] Intentando reproducir: ${song.title}`);

    // Intentamos obtener el stream con play-dl
    // Usamos configuraciones que ayudan a evitar la detección de bots
    let stream = await play.stream(song.url, {
        discordPlayerCompatibility: true,
        quality: 1
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo: **${song.title}**`);

  } catch (error) {
    console.error('[Music] Error:', error.message);
    
    // Si falla por el error de "Sign in", intentamos buscar una alternativa
    if (error.message.includes('confirm you’re not a bot') || error.message.includes('403')) {
        try {
            console.log(`[Music] Intentando buscar alternativa para: ${song.title}`);
            const r = await yts(`${song.title} audio`);
            const video = r.videos.find(v => v.url !== song.url);
            if (video) {
                song.url = video.url;
                song.title = video.title;
                return playSong(guildId);
            }
        } catch (e) {}
        
        queue.textChannel.send(`❌ YouTube bloqueó la reproducción de **${song.title}**. Intenta con otra canción.`);
    } else {
        queue.textChannel.send(`❌ Error al reproducir **${song.title}**.`);
    }

    queue.songs.shift();
    playSong(guildId);
  }
}

function skip(guildId) {
  const queue = queues.get(guildId);
  if (queue && queue.player) {
    queue.player.stop();
    return true;
  }
  return false;
}

function stop(guildId) {
  const queue = queues.get(guildId);
  if (queue) {
    queue.songs = [];
    if (queue.player) queue.player.stop();
    if (queue.connection) queue.connection.destroy();
    queues.delete(guildId);
    return true;
  }
  return false;
}

function getQueue(guildId) {
  const queue = queues.get(guildId);
  return queue ? queue.songs : [];
}

module.exports = {
  addSong,
  skip,
  stop,
  getQueue,
};
