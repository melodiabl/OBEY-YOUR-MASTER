const { SlashCommandBuilder } = require('discord.js');
const { addSong } = require('../../music/musicManager');
const ytdl = require('@distube/ytdl-core');
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
  async execute(client, interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice?.channel;
    
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
    }

    // Permisos del bot
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({ content: '❌ No tengo permisos para unirme o hablar en ese canal de voz.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let song;
      if (ytdl.validateURL(query)) {
        const info = await ytdl.getBasicInfo(query);
        song = { title: info.videoDetails.title, url: query };
      } else {
        const searchResult = await ytSearch(query);
        if (!searchResult || !searchResult.videos || !searchResult.videos.length) {
          return interaction.editReply({ content: '❌ No se encontró la canción.' });
        }
        const video = searchResult.videos[0];
        song = { title: video.title, url: video.url };
      }

      await addSong(interaction.guild, song, voiceChannel, interaction.channel);
      await interaction.editReply(`🎵 Buscando y añadiendo: **${song.title}**`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ Hubo un error al intentar procesar la canción.' });
    }
  },
};
