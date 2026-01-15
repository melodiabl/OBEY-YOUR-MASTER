const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

let player;

/**
 * Inicializa el Player de Discord Player de forma robusta.
 * @param {import('discord.js').Client} client El cliente de Discord.
 */
function initLavalink(client) {
  // Crear la instancia del Player
  player = new Player(client, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    }
  });

  // Cargar extractores de forma asíncrona (método recomendado en v6/v7)
  // Nota: Aunque es asíncrono, lo llamamos aquí para que empiece a cargar
  player.extractors.loadMulti(DefaultExtractors).then(() => {
    console.log('✅ Extractores de Discord Player cargados correctamente'.green);
  }).catch(err => {
    console.error('❌ Error al cargar extractores:', err);
  });

  // --- EVENTOS DEL PLAYER ---

  // Cuando una canción empieza a sonar
  player.events.on('playerStart', (queue, track) => {
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send(`▶️ Reproduciendo ahora: **${track.title}**\n🔗 ${track.url}`);
    }
  });

  // Cuando se añade una canción a la cola
  player.events.on('audioTrackAdd', (queue, track) => {
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send(`✅ Añadido a la cola: **${track.title}**`);
    }
  });

  // Cuando se añade una playlist
  player.events.on('audioTracksAdd', (queue, tracks) => {
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send(`✅ Añadidas **${tracks.length}** canciones de la playlist.`);
    }
  });

  // Cuando la cola se vacía
  player.events.on('emptyQueue', (queue) => {
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send('🎵 La cola ha terminado. ¡Gracias por escuchar!');
    }
  });

  // Cuando el bot es expulsado del canal de voz
  player.events.on('disconnect', (queue) => {
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send('❌ Me he desconectado del canal de voz.');
    }
  });

  // Manejo de errores globales
  player.events.on('error', (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send(`❌ Error crítico: ${error.message}`);
    }
  });

  player.events.on('playerError', (queue, error) => {
    console.error(`[Audio Error] ${error.message}`);
    if (queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send(`❌ Error de reproducción: ${error.message}`);
    }
  });

  client.player = player;
  console.log('🎵 Discord Player inicializado correctamente'.green);
  return player;
}

/**
 * Función para añadir y reproducir canciones.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!player) return textChannel.send('❌ El sistema de música no está listo.');

  try {
    // El método .play() es el más sencillo y potente en v6+
    const { track } = await player.play(voiceChannel, query, {
      nodeOptions: {
        // Metadata permite pasar información a los eventos
        metadata: {
          channel: textChannel,
          author: member,
          guild: guild
        },
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 30000,
        selfDeafen: true,
        volume: 80,
        bufferingTimeout: 3000,
      }
    });

    return track;
  } catch (err) {
    console.error('Error en Discord Player play:', err);
    
    // Manejo de errores específicos
    if (err.message.includes('Could not extract stream')) {
      return textChannel.send('❌ No se pudo extraer el audio de esta fuente. Prueba con otro enlace.');
    }
    
    return textChannel.send(`❌ Hubo un error al intentar reproducir: ${err.message}`);
  }
}

function skip(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue || !queue.isPlaying()) return false;
  queue.node.skip();
  return true;
}

function stop(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue) return false;
  queue.delete();
  return true;
}

function getQueue(guildId) {
  const queue = player.nodes.get(guildId);
  if (!queue) return [];
  return queue.tracks.toArray();
}

module.exports = {
  initLavalink, // Mantenemos el nombre por compatibilidad
  startLavalink: () => {}, // No necesario para Discord Player
  addSong,
  skip,
  stop,
  getQueue,
};
