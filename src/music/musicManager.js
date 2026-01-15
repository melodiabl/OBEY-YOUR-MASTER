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
    connectionTimeout: 30000,
    smoothVolume: true,
  });

  // Cargar extractores oficiales, pero bloqueando SoundCloud
  player.extractors.loadMulti(DefaultExtractors).then(() => {
    const scExtractor = player.extractors.get('soundcloud');
    if (scExtractor) {
      player.extractors.unregister(scExtractor);
      console.log('🚫 Extractor de SoundCloud desactivado por calidad'.yellow);
    }
  });

  // --- EVENTOS DE LA COLA ---

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

  player.events.on('error', (queue, error) => {
    console.error(`[Error General] ${error.message}`);
    queue.metadata.channel.send(`❌ Error en la cola: ${error.message}`);
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`[Error de Audio] ${error.message}`);
    queue.metadata.channel.send(`❌ Error de reproducción: ${error.message}`);
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

  // Determinar estrategia de búsqueda
  let strategy = QueryType.AUTO;
  if (!query.startsWith('http')) {
    strategy = QueryType.YOUTUBE_SEARCH;
  }

  try {
    // Realizar la búsqueda
    const searchResult = await player.search(query, {
      requestedBy: member,
      searchEngine: strategy
    }).catch(() => null);

    if (!searchResult || !searchResult.tracks.length) {
      return textChannel.send(`❌ No se encontraron resultados para: \`${query}\``);
    }

    // Ejecutar reproducción
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
    console.error('Error en addSong:', e);
    textChannel.send(`❌ Error al intentar reproducir: ${e.message}`);
    return null;
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
