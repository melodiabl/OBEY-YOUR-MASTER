const { Manager } = require('magmastream');
const { EmbedBuilder } = require('discord.js');

let manager;

/**
 * Inicializa el gestor de Lavalink.
 * @param {import('discord.js').Client} client El cliente de Discord.
 */
function initLavalink(client) {
  manager = new Manager({
    nodes: [
      {
        host: 'lava.link',
        port: 80,
        password: 'youshallnotpass',
        secure: false,
        retryAmount: 5,
        retryDelay: 5000,
      },
      {
        host: 'lavalink.oops.wtf',
        port: 443,
        password: 'www.corwin.pro',
        secure: true,
        retryAmount: 5,
        retryDelay: 5000,
      },
      {
        host: 'lavalink.lexis.host',
        port: 443,
        password: 'lexishostlavalink',
        secure: true,
        retryAmount: 5,
        retryDelay: 5000,
      }
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
    playNextOnEnd: true, // Requerido por las versiones recientes de magmastream
  });

  // Eventos de Lavalink
  manager.on('nodeConnect', (node) => console.log(`✅ Lavalink: Nodo "${node.options.host}" conectado.`.green));
  manager.on('nodeError', (node, error) => console.log(`❌ Lavalink: Nodo "${node.options.host}" error: ${error.message}`.red));

  manager.on('trackStart', (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
      channel.send(`▶️ Reproduciendo ahora: **${track.title}**`);
    }
  });

  manager.on('queueEnd', (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
      channel.send('🎵 La cola ha terminado.');
    }
    player.destroy();
  });

  client.manager = manager;
  return manager;
}

/**
 * Función para añadir y reproducir canciones con Lavalink.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!manager) return textChannel.send('❌ El sistema de música no está listo.');

  const player = manager.create({
    guildId: guild.id,
    voiceChannel: voiceChannel.id,
    textChannel: textChannel.id,
    selfDeafen: true,
  });

  if (player.state !== 'CONNECTED') player.connect();

  try {
    const res = await manager.search(query, member);

    if (res.loadType === 'LOAD_FAILED') {
      if (!player.queue.current) player.destroy();
      throw res.exception;
    }

    switch (res.loadType) {
      case 'NO_MATCHES':
        if (!player.queue.current) player.destroy();
        return textChannel.send('❌ No se encontraron resultados.');

      case 'TRACK_LOADED':
        player.queue.add(res.tracks[0]);
        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return textChannel.send(`✅ Añadido a la cola: **${res.tracks[0].title}**`);

      case 'PLAYLIST_LOADED':
        player.queue.add(res.tracks);
        if (!player.playing && !player.paused && player.queue.totalSize === res.tracks.length) player.play();
        return textChannel.send(`✅ Añadida la playlist **${res.playlist.name}** con **${res.tracks.length}** canciones.`);

      case 'SEARCH_RESULT':
        player.queue.add(res.tracks[0]);
        if (!player.playing && !player.paused && !player.queue.size) player.play();
        return textChannel.send(`✅ Añadido a la cola: **${res.tracks[0].title}**`);
    }
  } catch (err) {
    console.error('Error en Lavalink search:', err);
    return textChannel.send('❌ Hubo un error al buscar la canción.');
  }
}

function skip(guildId) {
  const player = manager.players.get(guildId);
  if (player) {
    player.stop();
    return true;
  }
  return false;
}

function stop(guildId) {
  const player = manager.players.get(guildId);
  if (player) {
    player.destroy();
    return true;
  }
  return false;
}

function getQueue(guildId) {
  const player = manager.players.get(guildId);
  return player ? player.queue : [];
}

module.exports = {
  initLavalink,
  addSong,
  skip,
  stop,
  getQueue,
};
