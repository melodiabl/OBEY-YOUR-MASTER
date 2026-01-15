const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  StreamType,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');
const playdl = require('play-dl');
const fs = require('fs');
const path = require('path');

// Mapa para mantener las colas por servidor
const queues = new Map();

// Función para limpiar y formatear cookies para play-dl
function formatCookies(rawContent) {
  if (!rawContent) return null;
  
  // Si es JSON, lo convertimos a string de cookies
  if (rawContent.trim().startsWith('[') || rawContent.trim().startsWith('{')) {
    try {
      const json = JSON.parse(rawContent);
      return json.map(c => `${c.name}=${c.value}`).join('; ');
    } catch (e) {
      console.error('Error parseando JSON de cookies:', e);
    }
  }

  // Si es formato Netscape o texto plano, limpiamos líneas y comentarios
  return rawContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const parts = line.split(/\s+/);
      if (parts.length >= 7) {
        return `${parts[5]}=${parts[6]}`;
      }
      return line; // Si ya parece una cookie key=value
    })
    .join('; ')
    .replace(/[\n\r\t]/g, ''); // Eliminar cualquier carácter de control invisible
}

// Configuración inicial de play-dl
async function setupPlayDL() {
  const cookiesPath = path.join(process.cwd(), 'cookies.json');
  const cookiesTxtPath = path.join(process.cwd(), 'cookies.txt');
  let rawCookies = null;

  if (fs.existsSync(cookiesPath)) {
    rawCookies = fs.readFileSync(cookiesPath, 'utf8');
  } else if (fs.existsSync(cookiesTxtPath)) {
    rawCookies = fs.readFileSync(cookiesTxtPath, 'utf8');
  }

  // Configurar User-Agent global para evitar bloqueos
  try {
    // play-dl permite configurar opciones globales
    // Intentamos configurar un agente común
  } catch (e) {}

  if (rawCookies) {
    try {
      const cleanCookies = formatCookies(rawCookies);
      if (cleanCookies) {
        await playdl.setToken({
          youtube: {
            cookie: cleanCookies
          }
        });
        console.log('✅ play-dl: Cookies de YouTube cargadas y limpiadas correctamente.');
      }
    } catch (err) {
      console.error('❌ play-dl: Error al configurar las cookies:', err.message);
    }
  }
}

// Ejecutar configuración
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
    queues.set(guild.id, guild.id); // Usar guild.id como clave consistente
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

  // Validar que la canción tenga una URL válida
  if (!song || !song.url) {
    console.error('Error: Canción sin URL válida:', song);
    queue.textChannel.send(`❌ Error: La canción **${song?.title || 'desconocida'}** no tiene una URL válida.`);
    queue.songs.shift();
    play(guildId);
    return;
  }

  try {
    console.log(`Intentando reproducir: ${song.title} - URL: ${song.url}`);
    
    const cleanUrl = String(song.url).trim();
    
    // MÉTODO ROBUSTO: Obtener info primero para asegurar que la URL es procesable
    // Esto resuelve el error de "input: undefined" interno de play-dl
    const videoInfo = await playdl.video_info(cleanUrl).catch(e => {
      console.error('Error al obtener video_info:', e.message);
      return null;
    });

    let stream;
    if (videoInfo) {
      // Si tenemos info, pedimos el stream usando el objeto de info
      stream = await playdl.stream_from_info(videoInfo, {
        discordPlayerCompatibility: true,
        quality: 1
      });
    } else {
      // Si falla video_info, intentamos el método directo como último recurso
      console.log('Reintentando stream directo...');
      stream = await playdl.stream(cleanUrl, {
        discordPlayerCompatibility: true,
        quality: 1
      });
    }

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo ahora: **${song.title}**`);

  } catch (error) {
    console.error('Error crítico al reproducir con play-dl:', error);
    
    // Si el error es el de URL inválida interno, intentamos buscar la canción de nuevo por título
    if (error.message.includes('Invalid URL') || error.input === 'undefined') {
      try {
        console.log(`Intentando recuperación por búsqueda para: ${song.title}`);
        const searchResult = await playdl.search(song.title, { limit: 1 });
        if (searchResult.length > 0 && searchResult[0].url !== song.url) {
          song.url = searchResult[0].url;
          return play(guildId); // Reintentar con la nueva URL
        }
      } catch (searchError) {
        console.error('Fallo la recuperación por búsqueda:', searchError);
      }
    }

    queue.textChannel.send(`❌ Error al reproducir **${song.title}**. YouTube podría estar bloqueando la conexión o la URL es inválida.`);
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
