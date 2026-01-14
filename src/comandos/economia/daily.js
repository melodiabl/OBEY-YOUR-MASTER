module.exports = {
  DESCRIPTION: 'Reclama tu recompensa diaria',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    const userData = await client.db.getUserData(message.author.id);
    const now = Date.now();
    if (userData.dailyCooldown && userData.dailyCooldown > now) {
      const diff = userData.dailyCooldown - now;
      const hours = Math.ceil(diff / (1000 * 60 * 60));
      return message.reply(`Vuelve en ${hours} horas para reclamar tu recompensa diaria.`);
    }
    const amount = Math.floor(Math.random() * 201) + 100;
    userData.money = (userData.money || 0) + amount;
    userData.dailyCooldown = now + 24 * 60 * 60 * 1000;
    await userData.save();
    message.reply(`Has reclamado ${amount} monedas de tu recompensa diaria.`);
  },
};