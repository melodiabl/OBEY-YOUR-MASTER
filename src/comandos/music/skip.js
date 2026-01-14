const musicManager = require('../../music/musicManager');

module.exports = {
  DESCRIPTION: 'Salta la canción actual',
  ALIASES: ['s'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute(client, message) {
    musicManager.skip(message.guild.id);
    message.reply('⏭️ Canción saltada.');
  },
};