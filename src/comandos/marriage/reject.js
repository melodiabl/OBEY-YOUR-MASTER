const marriageManager = require('../../utils/marriageManager');

module.exports = {
  DESCRIPTION: 'Rechaza una propuesta de matrimonio',
  ALIASES: ['decline'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    const proposerId = marriageManager.getProposer(message.author.id);
    if (!proposerId) return message.reply('No tienes ninguna propuesta pendiente.');
    marriageManager.reject(message.author.id);
    message.reply('Has rechazado la propuesta de matrimonio.');
  },
};