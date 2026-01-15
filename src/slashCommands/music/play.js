const { SlashCommandBuilder } = require('discord.js');
const { addSong } = require('../../music/musicManager');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música en tu canal de voz')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Enlace o nombre de la canción')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephermal: true });
    }
    let song;
    if (ytdl.validateURL(query)) {
      song = { title: query, url: query };
    } else {
      const searchResult = await ytSearch(query);
      if (!searchResult || !searchResult.videos || !searchResult.videos.length) {
        return interaction.reply({ content: '❌ No se encontró la canción.', ephermal: true });
      }
      const video = searchResult.videos[0];
      song = { title: video.title, url: video.url };
    }
    await addSong(interaction.guild.id, song, voiceChannel, interaction.channel, client);
    await interaction.reply(`🎵 Canción añadida a la cola: **${song.title}**`);
  },
};
