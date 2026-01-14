module.exports = {
  DESCRIPTION: 'Retira monedas de tu banco',
  ALIASES: ['wd'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message, args) {
    const amount = parseInt(args[0], 10);
    if (!amount || amount <= 0) {
      return message.reply('Debes especificar una cantidad válida.');
    }
    const userData = await client.db.getUserData(message.author.id);
    if ((userData.bank || 0) < amount) {
      return message.reply('No tienes suficiente dinero en el banco.');
    }
    userData.bank -= amount;
    userData.money = (userData.money || 0) + amount;
    await userData.save();
    message.reply(`Has retirado ${amount} monedas de tu banco.`);
  },
};