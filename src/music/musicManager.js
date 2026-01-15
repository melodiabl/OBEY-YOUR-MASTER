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
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

// Mapa para mantener las colas por servidor
const queues = new Map();

// Función para parsear cookies de Netscape a JSON
function parseNetscapeCookies(content) {
  const cookies = [];
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 7) continue;
    cookies.push({
      domain: parts[0],
      expirationDate: parts[4] === '0' ? null : parseInt(parts[4]),
      hostOnly: parts[1] === 'FALSE',
      httpOnly: false,
      name: parts[5],
      path: parts[2],
      sameSite: 'unspecified',
      secure: parts[3] === 'TRUE',
      session: parts[4] === '0',
      storeId: '0',
      value: parts[6]
    });
  }
  return cookies;
}

// Función para obtener opciones de ytdl con cookies si existen
function getYTOptions() {
  const options = {
    filter: 'audioonly',
    highWaterMark: 1 << 25,
    quality: 'highestaudio',
    liveBuffer: 40000,
    dlChunkSize: 0, // Desactivar chunking para evitar problemas de formato
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'Sec-Fetch-Mode': 'navigate'
      }
    }
  };

  const cookiesPath = path.join(process.cwd(), 'cookies.json');
  const cookiesTxtPath = path.join(process.cwd(), 'cookies.txt');
  
  let cookiesData = null;
  let finalCookies = null;

  if (fs.existsSync(cookiesPath)) {
    cookiesData = fs.readFileSync(cookiesPath, 'utf8');
  } else if (fs.existsSync(cookiesTxtPath)) {
    cookiesData = fs.readFileSync(cookiesTxtPath, 'utf8');
  }

  if (cookiesData) {
    try {
      if (cookiesData.trim().startsWith('[') || cookiesData.trim().startsWith('{')) {
        finalCookies = JSON.parse(cookiesData);
      } else if (cookiesData.includes('Netscape') || cookiesData.includes('.youtube.com')) {
        finalCookies = parseNetscapeCookies(cookiesData);
      }
      
      if (finalCookies) {
        options.agent = ytdl.createAgent(finalCookies);
      }
    } catch (err) {
      console.error('❌ Error al procesar las cookies de YouTube:', err.message);
    }
  }

  return options;
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

  try {
    // Usar ytdl para obtener el stream con las opciones optimizadas
    const stream = ytdl(song.url, getYTOptions());

    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true
    });

    if (resource.volume) resource.volume.setVolume(0.5);
    
    queue.player.play(resource);
    queue.textChannel.send(`▶️ Reproduciendo ahora: **${song.title}**`);

  } catch (error) {
    console.error('Error al reproducir la canción:', error);
    queue.textChannel.send(`❌ Error al reproducir **${song.title}**. Intentando saltar...`);
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
