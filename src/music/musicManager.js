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
 * Configuración inicial de play-dl siguiendo el estándar oficial.
 * Se encarga de cargar cookies y configurar el comportamiento de la librería.
 */
async function setupPlayDL() {
  const cookiesPath = path.join(process.cwd(), 'cookies.json');
  
  if (fs.existsSync(cookiesPath)) {
    try {
      let rawCookie = fs.readFileSync(cookiesPath, 'utf8');
      
      // Limpieza profunda de la cookie para evitar ERR_INVALID_CHAR
      // 1. Eliminar saltos de línea, retornos de carro y tabulaciones
      // 2. Eliminar caracteres no-ASCII que suelen causar errores en headers HTTP
      // 3. Trim de espacios en los extremos
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
        console.log('✅ play-dl: Cookies limpiadas y configuradas correctamente.');
      }
    } catch (err) {
      console.error('❌ play-dl: Error al configurar tokens:', err.message);
    }
  }
}

// Ejecutar configuración al cargar el módulo
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
 * Función principal de reproducción siguiendo el flujo oficial de play-dl.
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) return;

  const song = queue.songs[0];

  try {
    console.log(`[play-dl] Intentando reproducir: ${song.title}`);

    // 1. Obtener información del video (necesario para stream_from_info o validación interna)
    // play-dl maneja internamente la rotación de agentes si está configurado
    let stream = await play.stream(song.url, {
        discordPlayerCompatibility: true
    });

    // 2. Crear el recurso de audio usando el stream y el tipo proporcionado por play-dl
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo ahora: **${song.title}**`);

  } catch (error) {
    console.error('[play-dl] Error en la reproducción:', error);
    
    // Manejo específico para errores de validación o URL
    if (error.message.includes('copyright') || error.message.includes('confirm you’re not a bot')) {
        queue.textChannel.send(`❌ YouTube ha bloqueado la reproducción de **${song.title}** por restricciones de seguridad o copyright.`);
    } else {
        queue.textChannel.send(`❌ Error al reproducir **${song.title}**. Intentando con la siguiente...`);
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
