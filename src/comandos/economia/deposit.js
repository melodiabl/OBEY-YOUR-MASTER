module.exports = {
  DESCRIPTION: 'Deposita monedas en tu banco',
  ALIASES: ['dep'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message, args) {
    const amount = parseInt(args[0], 10);
    if (!amount || amount <= 0) {
      return message.reply('Debes especificar una cantidad válida.');
    }
    const userData = await client.db.getUserData(message.author.id);
    if ((userData.money || 0) < amount) {
      return message.reply('No tienes suficiente dinero.');
    }
    userData.money -= amount;
    userData.bank = (userData.bank || 0) + amount;
    await userData.save();
    message.reply(`Has depositado ${amount} monedas en tu banco.`);
  },
};