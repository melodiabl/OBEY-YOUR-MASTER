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
const playdl = require('play-dl');
const fs = require('fs');
const path = require('path');

// Mapa para mantener las colas por servidor
const queues = new Map();

// Función para obtener cookies en el formato que ytdl-core espera
function getCookies() {
  const cookiesPath = path.join(process.cwd(), 'cookies.json');
  if (fs.existsSync(cookiesPath)) {
    try {
      const raw = fs.readFileSync(cookiesPath, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error al leer cookies.json:', e);
    }
  }
  return null;
}

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
        return textChannel.send('❌ No se pudo conectar al canal de voz en 30 segundos.');
      }

      connection.subscribe(queue.player);
      
      setupPlayerEvents(guild.id);
      play(guild.id);

    } catch (error) {
      console.error('Error al iniciar la música:', error);
      queues.delete(guild.id);
      textChannel.send('❌ Hubo un error al intentar unirse al canal.');
    }
  } else {
    queue.songs.push(song);
    return textChannel.send(`✅ **${song.title}** se ha añadido a la lista.`);
  }
}

function setupPlayerEvents(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  queue.player.on(AudioPlayerStatus.Idle, () => {
    queue.songs.shift();
    if (queue.songs.length > 0) {
      play(guildId);
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
    console.error(`Error en el reproductor del servidor ${guildId}:`, error);
    queue.songs.shift();
    play(guildId);
  });
}

async function play(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  if (!song || !song.url) {
    queue.textChannel.send(`❌ Error: La canción no tiene una URL válida.`);
    queue.songs.shift();
    play(guildId);
    return;
  }

  try {
    console.log(`Intentando reproducir con ytdl-core optimizado: ${song.title}`);
    
    const cookies = getCookies();
    
    // Configuración de stream optimizada para evitar bloqueos
    const stream = ytdl(song.url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
      agent: cookies ? ytdl.createAgent(cookies) : undefined,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive'
        }
      }
    });

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo ahora: **${song.title}**`);

  } catch (error) {
    console.error('Error crítico al reproducir con ytdl-core:', error);
    
    // Intento de recuperación por búsqueda si falla la URL
    try {
      console.log(`Intentando recuperación por búsqueda para: ${song.title}`);
      const searchResult = await playdl.search(song.title, { limit: 1 });
      if (searchResult.length > 0 && searchResult[0].url !== song.url) {
        song.url = searchResult[0].url;
        return play(guildId);
      }
    } catch (e) {}

    queue.textChannel.send(`❌ Error al reproducir **${song.title}**. YouTube podría estar bloqueando la conexión.`);
    queue.songs.shift();
    play(guildId);
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
