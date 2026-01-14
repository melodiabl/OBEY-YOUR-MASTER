const musicManager = require('../../music/musicManager');

module.exports = {
  DESCRIPTION: 'Muestra la lista de reproducción',
  ALIASES: ['q', 'list'],
  BOT_PERMISSIONS: ['Connect', 'Speak'],
  PERMISSIONS: [],
  async execute(client, message) {
    const queue = musicManager.getQueue(message.guild.id);
    if (!queue || queue.length === 0) {
      return message.reply('No hay canciones en la cola.');
    }
    const description = queue.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
    message.reply(`**Lista de reproducción:**\n${description}`);
  },
};