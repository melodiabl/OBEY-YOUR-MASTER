const { SlashCommandBuilder } = require('discord.js');
const { addSong } = require('../../music/musicManager');
const playdl = require('play-dl');

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

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({ content: '❌ No tengo permisos para unirme o hablar en ese canal de voz.', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      let song;
      // play-dl maneja la validación y búsqueda de forma integrada
      if (playdl.yt_validate(query) === 'video') {
        const info = await playdl.video_info(query);
        if (!info || !info.video_details) {
          return interaction.editReply({ content: '❌ No se pudo obtener información del video.' });
        }
        song = { title: info.video_details.title, url: query };
      } else {
        const searchResult = await playdl.search(query, { limit: 1 });
        if (!searchResult || searchResult.length === 0) {
          return interaction.editReply({ content: '❌ No se encontró la canción.' });
        }
        const video = searchResult[0];
        
        // Validar que el video tenga URL antes de crear el objeto song
        if (!video || !video.url) {
          console.error('Error: Video sin URL válida:', video);
          return interaction.editReply({ content: '❌ No se pudo obtener la URL del video.' });
        }
        
        song = { title: video.title, url: video.url };
      }

      await addSong(interaction.guild, song, voiceChannel, interaction.channel);
      await interaction.editReply(`🎵 Buscando y añadiendo: **${song.title}**`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: '❌ Hubo un error al intentar procesar la canción con play-dl.' });
    }
  },
};
