const { Kazagumo, Plugins } = require('kazagumo');
const { Connectors } = require('shoukaku');

let kazagumo;

/**
 * Inicializa Kazagumo con Shoukaku.
 */
function initLavalink(client) {
  const Nodes = [{
    name: 'Local Node',
    url: '127.0.0.1:2333',
    auth: 'youshallnotpass',
    secure: false
  }];

  kazagumo = new Kazagumo({
    defaultSearchEngine: 'youtube',
    plugins: [new Plugins.PlayerMoved(client)],
    send: (guildId, payload) => {
      const guild = client.guilds.cache.get(guildId);
      if (guild) guild.shard.send(payload);
    }
  }, new Connectors.DiscordJS(client), Nodes);

  // --- EVENTOS DE KAZAGUMO ---

  kazagumo.shoukaku.on('ready', (name) => console.log(`✅ [Kazagumo] Nodo ${name} conectado correctamente.`.green));
  kazagumo.shoukaku.on('error', (name, error) => console.error(`❌ [Kazagumo] Error en nodo ${name}:`, error));

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
