const { SlashCommandBuilder } = require('discord.js');
const { addSong } = require('../../music/musicManager');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce música en tu canal de voz (YouTube, Spotify, etc.)')
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
      await interaction.editReply(`🔍 Buscando: **${query}**...`);
      
      const track = await addSong(interaction.guild, query, voiceChannel, interaction.channel, interaction.user);
      
      if (track && track.title) {
        await interaction.editReply(`🎵 Encontrado y reproduciendo: **${track.title}**`);
      } else {
        await interaction.editReply(`❌ No se encontraron resultados válidos para: **${query}**`);
      }
    } catch (error) {
      console.error('Error en slash command play:', error);
      // Si el error ya fue manejado en addSong y enviado al canal, solo editamos la respuesta original
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Error al procesar la música.', ephemeral: true });
      } else {
        await interaction.editReply({ content: '❌ Hubo un error al intentar reproducir la canción.' });
      }
    }
  },
};
