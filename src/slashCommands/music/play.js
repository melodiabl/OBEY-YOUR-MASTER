const { SlashCommandBuilder } = require('discord.js');
const { addSong } = require('../../music/musicManager');
const yts = require('yt-search');

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
      // Usamos yt-search para obtener la información de forma estable
      const r = await yts(query);
      const video = r.videos[0];

      if (!video) {
        return interaction.editReply({ content: '❌ No se encontró la canción.' });
      }

      // Construimos el objeto song correctamente para el musicManager local
      const song = { 
        title: video.title, 
        url: video.url,
        duration: video.timestamp,
        thumbnail: video.thumbnail
      };

      await addSong(interaction.guild, song, voiceChannel, interaction.channel);
      await interaction.editReply(`🎵 Añadiendo a la cola: **${song.title}**`);
    } catch (error) {
      console.error('Error en slash command play:', error);
      await interaction.editReply({ content: '❌ Hubo un error al intentar procesar la canción.' });
    }
  },
};
