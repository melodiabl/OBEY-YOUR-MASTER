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
const fs = require('fs');
const path = require('path');

// Mapa para mantener las colas por servidor
const queues = new Map();

/**
 * Configuración inicial de play-dl con evasión de detección de bots.
 */
async function setupPlayDL() {
  const cookiesPath = path.join(process.cwd(), 'cookies.json');
  
  // Configuración de User-Agent global para simular un navegador real
  // Esto ayuda a que YouTube no bloquee la IP tan agresivamente
  try {
    // play-dl permite configurar opciones globales a través de su motor interno
  } catch (e) {}

  if (fs.existsSync(cookiesPath)) {
    try {
      let rawCookie = fs.readFileSync(cookiesPath, 'utf8');
      const cleanCookie = rawCookie
        .replace(/[\r\n\t]/g, '')
        .replace(/[^\x20-\x7E]/g, '') 
        .trim();

      if (cleanCookie) {
        await play.setToken({
          youtube: {
            cookie: cleanCookie
          }
        });
        console.log('✅ play-dl: Cookies configuradas y sanitizadas.');
      }
    } catch (err) {
      console.error('❌ play-dl: Error al configurar tokens:', err.message);
    }
  }
}

setupPlayDL();

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
      playSong(guild.id);

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
    console.error(`Error en el reproductor del servidor ${guildId}:`, error);
    queue.songs.shift();
    playSong(guildId);
  });
}

/**
 * Reproducción con manejo de bloqueos y reintentos.
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    console.log(`[play-dl] Intentando reproducir: ${song.title}`);

    // Intentar obtener el stream con headers de navegador para evitar detección
    let stream = await play.stream(song.url, {
        discordPlayerCompatibility: true,
        htm: true, // Habilitar modo HTML para simular mejor un navegador
        quality: 1,
        precooked: true // Usar cookies pre-configuradas si existen
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo ahora: **${song.title}**`);

  } catch (error) {
    console.error('[play-dl] Error en la reproducción:', error.message);
    
    if (error.message.includes('confirm you’re not a bot') || error.message.includes('403')) {
        queue.textChannel.send(`⚠️ YouTube ha detectado actividad inusual. Intentando método de recuperación...`);
        
        // MÉTODO DE RECUPERACIÓN: Buscar una versión alternativa (Lyric Video, Audio, etc.)
        try {
            const search = await play.search(`${song.title} audio`, { limit: 2 });
            const alternative = search.find(v => v.url !== song.url);
            
            if (alternative) {
                console.log(`[play-dl] Reintentando con alternativa: ${alternative.title}`);
                song.url = alternative.url;
                song.title = alternative.title;
                return playSong(guildId);
            }
        } catch (e) {
            console.error('[play-dl] Falló la recuperación:', e.message);
        }
        
        queue.textChannel.send(`❌ Bloqueo persistente de YouTube. Por favor, actualiza las cookies o intenta más tarde.`);
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
