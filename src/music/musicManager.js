const { Player, QueryType } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

let player;

/**
 * Inicializa el Player de forma ultra-compatible.
 */
function initLavalink(client) {
  player = new Player(client, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    }
  });

  // Cargar extractores y confirmar en consola
  player.extractors.loadMulti(DefaultExtractors).then(() => {
    console.log('✅ [Music] Extractores cargados correctamente'.green);
    
    // Desactivar SoundCloud para mejorar calidad de resultados
    const sc = player.extractors.get('soundcloud');
    if (sc) {
      player.extractors.unregister(sc);
      console.log('🚫 [Music] SoundCloud desactivado'.yellow);
    }
  }).catch(err => {
    console.error('❌ [Music] Error crítico al cargar extractores:'.red, err);
  });

  // --- EVENTOS BÁSICOS ---
  player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`▶️ **Reproduciendo:** \`${track.title}\``);
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`✅ **En cola:** \`${track.title}\``);
  });

  player.events.on('error', (queue, error) => {
    console.error(`❌ [Player Error] ${error.message}`);
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`❌ [Audio Error] ${error.message}`);
  });

  client.player = player;
  return player;
}

/**
 * Función de búsqueda y reproducción simplificada.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!player) return null;

  console.log(`🔍 [Search] Buscando: "${query}" solicitado por ${member.tag}`);

  try {
    // Intentar búsqueda directa
    const result = await player.search(query, {
      requestedBy: member,
      searchEngine: QueryType.AUTO
    }).catch(err => {
      console.error('❌ [Search Error]', err.message);
      return null;
    });

    if (!result || !result.tracks.length) {
      console.log(`⚠️ [Search] No se encontraron resultados para: ${query}`);
      return null;
    }

    console.log(`🎵 [Search] Encontrado: "${result.tracks[0].title}" (${result.tracks[0].url})`);

    const { track } = await player.play(voiceChannel, result, {
      nodeOptions: {
        metadata: { channel: textChannel },
        selfDeafen: true,
        leaveOnEmpty: true,
        leaveOnEnd: true,
      }
    });

    return track;
  } catch (e) {
    console.error('❌ [Play Error]', e.message);
    textChannel.send(`❌ Error al reproducir: ${e.message}`);
    return null;
  }
}

module.exports = {
  initLavalink,
  startLavalink: () => {},
  addSong,
  skip: (id) => {
    const q = player.nodes.get(id);
    return q ? q.node.skip() : false;
  },
  stop: (id) => {
    const q = player.nodes.get(id);
    return q ? q.delete() : false;
  },
  getQueue: (id) => {
    const q = player.nodes.get(id);
    return q ? q.tracks.toArray() : [];
  }
};
