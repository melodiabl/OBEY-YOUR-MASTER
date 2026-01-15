const { SlashCommandBuilder } = require('discord.js');
const { getQueue } = require('../../music/musicManager');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la lista de canciones en cola'),
  async execute(client, interaction) {
    const queue = getQueue(interaction.guild.id);
    if (!queue || !queue.songs.length) {
      return interaction.reply('❌ No hay canciones en la cola.');
    }
    let msg = '🎵 **Cola de reproducción:**\n';
    queue.songs.forEach((song, index) => {
      msg += `${index + 1}. ${song.title}\n`;
    });
    await interaction.reply(msg);
  },
};
