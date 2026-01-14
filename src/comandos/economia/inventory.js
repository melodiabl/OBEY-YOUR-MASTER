module.exports = {
  DESCRIPTION: 'Muestra tu inventario',
  ALIASES: ['inv'],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    const userData = await client.db.getUserData(message.author.id);
    const items = userData.inventory || [];
    message.reply(`Inventario: ${items.length ? items.join(', ') : 'Vacío'}`);
  },
};