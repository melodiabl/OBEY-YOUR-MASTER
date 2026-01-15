const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

let player;

/**
 * Inicializa el Player de Discord Player.
 * @param {import('discord.js').Client} client El cliente de Discord.
 */
function initLavalink(client) {
  player = new Player(client, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    }
  });

  // Cargar extractores por defecto
  player.extractors.loadDefault();

  // Eventos del Player
  player.events.on('playerStart', (queue, track) => {
    queue.metadata.channel.send(`▶️ Reproduciendo ahora: **${track.title}**`);
  });

  player.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata.channel.send(`✅ Añadido a la cola: **${track.title}**`);
  });

  player.events.on('emptyQueue', (queue) => {
    queue.metadata.channel.send('🎵 La cola ha terminado.');
  });

  player.events.on('error', (queue, error) => {
    console.log(`❌ Error en la cola: ${error.message}`);
  });

  player.events.on('playerError', (queue, error) => {
    console.log(`❌ Error en el reproductor: ${error.message}`);
  });

  client.player = player;
  console.log('🎵 Discord Player inicializado correctamente'.green);
  return player;
}

/**
 * Función vacía para mantener compatibilidad con el evento ready si se llama.
 */
function startLavalink(clientId) {
  // No es necesario para Discord Player, pero lo mantenemos para no romper el evento ready
}

/**
 * Función para añadir y reproducir canciones con Discord Player.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!player) return textChannel.send('❌ El sistema de música no está listo.');

  try {
    const res = await player.play(voiceChannel, query, {
      nodeOptions: {
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
      }
    });

    return res;
  } catch (err) {
    console.error('Error en Discord Player play:', err);
    return textChannel.send('❌ Hubo un error al intentar reproducir la canción.');
  }
}

function skip(guildId) {
  const queue = player.nodes.get(guildId);
  if (queue) {
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
  initLavalink, // Mantenemos el nombre para compatibilidad con Client.js
  startLavalink,
  addSong,
  skip,
  stop,
  getQueue,
};
