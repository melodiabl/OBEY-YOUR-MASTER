const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

// Maintain a queue for each guild
const queues = new Map();

async function addSong(guild, song, voiceChannel, textChannel) {
  let queue = queues.get(guild.id);
  if (!queue) {
    queue = { songs: [], player: null, connection: null };
    queues.set(guild.id, queue);
  }
  queue.songs.push({ ...song, voiceChannel, textChannel });
  if (!queue.player) {
    playNextSong(guild.id);
    await textChannel.send(`▶️ Reproduciendo: **${song.title}**\n${song.url}`);
  } else {
    await textChannel.send(`✅ **${song.title}** se ha añadido a la lista.`);
  }
}

function playNextSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue || queue.songs.length === 0) {
    if (queue?.connection) queue.connection.destroy();
    queues.delete(guildId);
    return;
  }

  const { url, voiceChannel, textChannel } = queue.songs.shift();

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  queue.connection = connection;

  const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
  const resource = createAudioResource(stream, { inlineVolume: true });
  if (resource.volume) resource.volume.setVolume(0.5);
  const player = createAudioPlayer();
  queue.player = player;
  player.play(resource);
  connection.subscribe(player);

  player.on('error', error => {
    console.error(error);
    playNextSong(guildId);
  });
  player.on(AudioPlayerStatus.Idle, () => {
    playNextSong(guildId);
  });
}

function skip(guildId) {
  const queue = queues.get(guildId);
  if (queue?.player) {
    queue.player.stop();
  }
}

function stop(guildId) {
  const queue = queues.get(guildId);
  if (queue) {
    queue.songs = [];
    if (queue.player) queue.player.stop();
    if (queue.connection) queue.connection.destroy();
    queues.delete(guildId);
  }
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