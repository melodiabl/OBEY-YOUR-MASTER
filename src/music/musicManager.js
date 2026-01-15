const { Manager } = require('magmastream');
const { EmbedBuilder } = require('discord.js');

let manager;

/**
 * Inicializa el gestor de Lavalink apuntando al servidor local.
 * @param {import('discord.js').Client} client El cliente de Discord.
 */
function initLavalink(client) {
  manager = new Manager({
    nodes: [
      {
        host: '127.0.0.1', // Usamos IP directa para evitar problemas de resolución de localhost
        port: 2333,
        password: 'youshallnotpass',
        secure: false,
        retryAmount: 30, // Más reintentos
        retryDelay: 2000, // Reintentos más frecuentes
      }
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
    autoPlay: true,
    playNextOnEnd: true,
    destroyPlayerOrder: ['voice', 'player'],
  });

  // IMPORTANTE: Desactivar la conexión automática de los nodos al crearlos
  manager.nodes.forEach(node => {
    node.options.retryAmount = 0; // Evitar reintentos infinitos antes de estar listos
  });

  // Eventos de Lavalink
  manager.on('nodeConnect', (node) => console.log(`✅ Lavalink Local: Conectado exitosamente en ${node.options.host}:${node.options.port}`.green));
  manager.on('nodeError', (node, error) => {
    console.log(`❌ Lavalink Local Error en ${node.options.host}: ${error.message}`.red);
    console.log(`💡 Asegúrate de que el comando "java -jar Lavalink.jar" esté corriendo en otra terminal.`.yellow);
  });
  manager.on('nodeRaw', (node, payload) => console.log(`DEBUG Lavalink: Recibido paquete del nodo`.gray));

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
 * Inicializa el manager de Lavalink después de que el bot esté listo.
 * @param {string} clientId El ID del cliente de Discord.
 */
function startLavalink(clientId) {
  if (!clientId) return console.log('❌ No se puede inicializar Lavalink: ID de cliente no definido'.red);
  if (manager) {
    // Re-configurar nodos para permitir reintentos ahora que tenemos el ID
    manager.nodes.forEach(node => {
      node.options.retryAmount = 30;
    });
    manager.init(clientId);
    console.log(`🎵 Manager de Lavalink inicializado para el bot: ${clientId}`.green);
  }
}

/**
 * Función para añadir y reproducir canciones con Lavalink Local.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!manager) return textChannel.send('❌ El sistema de música no está listo.');

  // Intentar reconectar nodos si no hay ninguno disponible
  const availableNodes = manager.nodes.filter(n => n.connected);
  if (availableNodes.size === 0) {
    console.log('⚠️ No hay nodos conectados. Intentando reconectar...'.yellow);
    manager.nodes.forEach(node => node.connect());
    return textChannel.send('⏳ Conectando con el servidor de música local... Intenta de nuevo en 5 segundos.');
  }

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
  startLavalink,
  addSong,
  skip,
  stop,
  getQueue,
};
