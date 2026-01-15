const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

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
 * Reproducción usando ytdl-core con cliente de Android para evitar bloqueos.
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    console.log(`[Music] Reproduciendo: ${song.title}`);

    // Usamos ytdl-core con una configuración que simula el cliente de Android
    // Este método es actualmente el más efectivo para evitar el bloqueo de "bot"
    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      requestOptions: {
        headers: {
          // User-Agent de Android para saltarse restricciones de escritorio
          'User-Agent': 'com.google.android.youtube/19.29.37 (Linux; U; Android 11; en_US; Pixel 4 XL; Build/RP1A.200720.009) gzip',
          'X-YouTube-Client-Name': '3',
          'X-YouTube-Client-Version': '19.29.37'
        }
      }
    });

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo: **${song.title}**`);

  } catch (error) {
    console.error('[Music] Error:', error.message);
    
    // Si falla, intentamos una búsqueda rápida con yt-search para ver si la URL ha cambiado
    try {
        console.log(`[Music] Reintentando búsqueda para: ${song.title}`);
        const r = await yts(song.title);
        const video = r.videos[0];
        if (video && video.url !== song.url) {
            song.url = video.url;
            return playSong(guildId);
        }
    } catch (e) {
        console.error('Reintento fallido:', e.message);
    }

    queue.textChannel.send(`❌ No se pudo reproducir **${song.title}**. YouTube está bloqueando la conexión.`);
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
