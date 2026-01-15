const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');

let kazagumo;

/**
 * Inicializa Kazagumo con una lista de nodos externos y públicos.
 */
function initLavalink(client) {
  // Lista de nodos públicos estables (v3 y v4)
  const Nodes = [
    {
      name: 'Serenetia v4 (Global)',
      url: 'lavalinkv4.serenetia.com:443',
      auth: 'https://dsc.gg/ajidevserver',
      secure: true
    },
    {
      name: 'Jirayu (Asia/Global)',
      url: 'lavalink.jirayu.net:443',
      auth: 'youshallnotpass',
      secure: true
    },
    {
      name: 'Rive (Global)',
      url: 'lavalink.rive.wtf:443',
      auth: 'youshallnotpass',
      secure: true
    }
  ];

  kazagumo = new Kazagumo({
    defaultSearchEngine: 'youtube',
    plugins: [new Plugins.PlayerMoved(client)],
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    }
  }, new Connectors.DiscordJS(client), Nodes);

  // --- EVENTOS DE KAZAGUMO ---

  kazagumo.shoukaku.on('ready', (name) => console.log(`✅ [Lavalink] Nodo externo "${name}" conectado.`.green));
  kazagumo.shoukaku.on('error', (name, error) => {
    console.error(`❌ [Lavalink] Error en nodo "${name}":`.red, error.message || error);
  });
  
  kazagumo.shoukaku.on('close', (name, code, reason) => {
    console.warn(`⚠️ [Lavalink] Conexión cerrada en "${name}". Reintentando...`.yellow);
  });

  kazagumo.on('playerStart', (player, track) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) channel.send(`▶️ **Reproduciendo:** \`${track.title}\``);
  });

  kazagumo.on('playerEmpty', (player) => {
    const channel = client.channels.cache.get(player.textId);
    if (channel) channel.send('🎵 La cola ha terminado.');
    player.destroy();
  });

  client.manager = kazagumo;
  return kazagumo;
}

/**
 * Función para añadir canciones con Kazagumo.
 */
async function addSong(guild, query, voiceChannel, textChannel, member) {
  if (!kazagumo) return null;

  // Verificar si hay nodos disponibles
  const availableNodes = kazagumo.shoukaku.nodes.filter(n => n.state === 1);
  if (availableNodes.size === 0) {
    textChannel.send('❌ No hay servidores de música externos disponibles en este momento. Reintentando conexión...');
    return null;
  }

  try {
    let player = kazagumo.players.get(guild.id);
    if (!player) {
      player = await kazagumo.createPlayer({
        guildId: guild.id,
        voiceId: voiceChannel.id,
        textId: textChannel.id,
        deaf: true
      });
    }

    const result = await kazagumo.search(query, { requester: member });

    if (!result.tracks.length) {
      textChannel.send(`❌ No se encontraron resultados para: \`${query}\``);
      return null;
    }

    if (result.type === 'PLAYLIST') {
      for (const track of result.tracks) player.queue.add(track);
      textChannel.send(`✅ Playlist añadida: **${result.playlistName}** (${result.tracks.length} canciones)`);
    } else {
      player.queue.add(result.tracks[0]);
      textChannel.send(`✅ Añadido a la cola: **${result.tracks[0].title}**`);
    }

    if (!player.playing && !player.paused) player.play();
    return result.tracks[0];
  } catch (e) {
    console.error('❌ [Kazagumo Play Error]', e);
    textChannel.send(`❌ Error al intentar reproducir: ${e.message}`);
    return null;
  }
}

module.exports = {
  initLavalink,
  startLavalink: () => {},
  addSong,
  skip: (id) => {
    const p = kazagumo.players.get(id);
    return p ? p.skip() : false;
  },
  stop: (id) => {
    const p = kazagumo.players.get(id);
    return p ? p.destroy() : false;
  },
  getQueue: (id) => {
    const p = kazagumo.players.get(id);
    return p ? p.queue : [];
  }
};
