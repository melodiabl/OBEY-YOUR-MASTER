const SHOP = {
  pan: 50,
  hacha: 150,
  cana: 200,
  elixir: 500,
  escudo: 300,
};

module.exports = {
  DESCRIPTION: 'Vende un artículo de tu inventario por la mitad del precio',
  ALIASES: ['vender'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message, args) {
    const item = (args[0] || '').toLowerCase();
    if (!SHOP[item]) {
      return message.reply('Ese artículo no se puede vender.');
    }
    const userData = await client.db.getUserData(message.author.id);
    if (!Array.isArray(userData.inventory) || !userData.inventory.includes(item)) {
      return message.reply('No tienes ese artículo en tu inventario.');
    }
    const index = userData.inventory.indexOf(item);
    userData.inventory.splice(index, 1);
    const gain = Math.floor(SHOP[item] / 2);
    userData.money = (userData.money || 0) + gain;
    await userData.save();
    message.reply(`Has vendido ${item} y has recibido ${gain} monedas.`);
  },
};