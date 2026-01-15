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

// Mapa para mantener las colas por servidor
const queues = new Map();

/**
 * Configuración de play-dl SIN COOKIES.
 * Optimizamos para usar agentes libres y evitar bloqueos por IP.
 */
async function setupPlayDL() {
  try {
    // Forzamos a play-dl a no buscar archivos de cookies locales
    // y a usar un agente de navegador estándar.
    await play.setToken({
        youtube: {
            cookie: "" // Vacío para asegurar que no use cookies previas
        }
    });
    console.log('✅ play-dl: Configurado en modo sin cookies.');
  } catch (e) {
    console.error('Error en setupPlayDL:', e);
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
 * Reproducción optimizada para funcionar sin cookies.
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    console.log(`[play-dl] Reproduciendo (Sin Cookies): ${song.title}`);

    // Usamos un stream con configuraciones que suelen saltarse el bloqueo de bot
    // sin necesidad de estar logueado.
    let stream = await play.stream(song.url, {
        discordPlayerCompatibility: true,
        quality: 0, // Calidad automática/baja para mayor compatibilidad sin cookies
        language: 'es-ES'
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo: **${song.title}**`);

  } catch (error) {
    console.error('[play-dl] Error:', error.message);
    
    // Si falla por bloqueo, intentamos buscar la versión de YouTube Music
    // que suele estar menos protegida.
    if (error.message.includes('confirm you’re not a bot') || error.message.includes('403')) {
        try {
            console.log(`[play-dl] Intentando bypass vía YouTube Music para: ${song.title}`);
            const search = await play.search(song.title, { 
                limit: 1,
                source: { youtube: 'music' } 
            });
            
            if (search.length > 0 && search[0].url !== song.url) {
                song.url = search[0].url;
                return playSong(guildId);
            }
        } catch (e) {
            console.error('Bypass fallido:', e.message);
        }
        
        queue.textChannel.send(`❌ YouTube bloqueó la conexión. Intenta con otra canción o busca por nombre.`);
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
