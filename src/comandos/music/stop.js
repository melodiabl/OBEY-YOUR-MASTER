const musicManager = require('../../music/musicManager');

module.exports = {
  DESCRIPTION: 'Detiene la música y limpia la cola',
  ALIASES: [],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute(client, message) {
    musicManager.stop(message.guild.id);
    message.reply('⏹️ Música detenida y cola borrada.');
  },
};