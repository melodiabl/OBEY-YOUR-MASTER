const SHOP = {
  pan: 50,
  hacha: 150,
  cana: 200,
  elixir: 500,
  escudo: 300,
};

module.exports = {
  DESCRIPTION: 'Lista los artículos disponibles en la tienda',
  ALIASES: ['tienda'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    let msg = '**Tienda**\n';
    for (const [item, price] of Object.entries(SHOP)) {
      msg += `${item} — ${price} monedas\n`;
    }
    message.reply(msg);
  },
};