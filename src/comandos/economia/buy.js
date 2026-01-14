const SHOP = {
  pan: 50,
  hacha: 150,
  cana: 200,
  elixir: 500,
  escudo: 300,
};

module.exports = {
  DESCRIPTION: 'Compra un artículo de la tienda',
  ALIASES: ['comprar'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message, args) {
    const item = (args[0] || '').toLowerCase();
    if (!SHOP[item]) {
      return message.reply('Ese artículo no existe en la tienda.');
    }
    const cost = SHOP[item];
    const userData = await client.db.getUserData(message.author.id);
    if ((userData.money || 0) < cost) {
      return message.reply('No tienes suficiente dinero.');
    }
    userData.money -= cost;
    if (!Array.isArray(userData.inventory)) userData.inventory = [];
    userData.inventory.push(item);
    await userData.save();
    message.reply(`Has comprado ${item} por ${cost} monedas.`);
  },
};