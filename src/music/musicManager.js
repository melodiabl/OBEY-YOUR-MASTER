const { Player, QueryType } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

let player;

/**
 * Inicializa el Player con todas las configuraciones recomendadas por la documentación.
 */
function initLavalink(client) {
  player = new Player(client, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    },
    // Configuración de red y estabilidad
    connectionTimeout: 30000,
    smoothVolume: true,
  });

  // Cargar extractores oficiales
  player.extractors.loadMulti(DefaultExtractors);

  // --- EVENTOS DE LA COLA (GUILD QUEUE) ---

  player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`▶️ **Reproduciendo:** [${track.title}](${track.url}) - \`${track.duration}\``);
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`✅ **Añadido:** \`${track.title}\``);
  });

  player.events.on('audioTracksAdd', (queue, tracks) => {
    queue.metadata.channel.send(`🎶 **Playlist:** Se han añadido \`${tracks.length}\` canciones.`);
  });

  player.events.on('disconnect', (queue) => {
    queue.metadata.channel.send('👋 Me he desconectado del canal de voz.');
  });

  player.events.on('emptyChannel', (queue) => {
    queue.metadata.channel.send('🔇 El canal está vacío, deteniendo música...');
  });

  player.events.on('emptyQueue', (queue) => {
    queue.metadata.channel.send('🎵 La cola ha terminado.');
  });

  // --- MANEJO DE ERRORES (DOCUMENTACIÓN OFICIAL) ---

  player.events.on('error', (queue, error) => {
    console.error(`[Error General] ${error.message}`);
    queue.metadata.channel.send(`❌ Error en la cola: ${error.message}`);
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`[Error de Audio] ${error.message}`);
    queue.metadata.channel.send(`❌ Error de reproducción: ${error.message}`);
  });

  // Evento de depuración (opcional, útil para logs)
  player.on('debug', (message) => {
    if (process.env.DEBUG_MODE === 'true') console.log(`[Player Debug] ${message}`);
  });

  client.player = player;
  console.log('🎵 Discord Player v6/v7 configurado con éxito'.green);
  return player;
}

/**
 * Función para añadir canciones con búsqueda inteligente.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!player) return;

  // Realizar la búsqueda
  const searchResult = await player.search(query, {
    requestedBy: member,
    searchEngine: QueryType.AUTO // Detecta automáticamente si es YT, Spotify, etc.
  });

  if (!searchResult || !searchResult.tracks.length) {
    return textChannel.send(`❌ No se encontraron resultados para: \`${query}\``);
  }

  try {
    const { track } = await player.play(voiceChannel, searchResult, {
      nodeOptions: {
        metadata: {
          channel: textChannel,
          author: member,
          guild: guild
        },
        selfDeafen: true,
        volume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 30000,
      }
    });

    return track;
  } catch (e) {
    console.error(e);
    return textChannel.send(`❌ Error al intentar conectar: ${e.message}`);
  }
}

function skip(guildId) {
  const queue = player.nodes.get(guildId);
  if (queue && queue.isPlaying()) {
    queue.node.skip();
    return true;
  }
  return false;
}

function stop(guildId) {
  const queue = player.nodes.get(guildId);
  if (queue) {
    queue.delete();
    return true;
  }
  return false;
}

function getQueue(guildId) {
  const queue = player.nodes.get(guildId);
  return queue ? queue.tracks.toArray() : [];
}

module.exports = {
  initLavalink,
  startLavalink: () => {},
  addSong,
  skip,
  stop,
  getQueue,
};
