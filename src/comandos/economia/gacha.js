const rewards = [
  { name: '🍞 Pan', weight: 50 },
  { name: '🪓 Hacha', weight: 20 },
  { name: '🎣 Caña', weight: 15 },
  { name: '🧪 Elixir', weight: 10 },
  { name: '🛡️ Escudo', weight: 5 },
];

function getRandomReward() {
  const total = rewards.reduce((acc, item) => acc + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of rewards) {
    if (rand < item.weight) return item.name;
    rand -= item.weight;
  }
  return rewards[0].name;
}

module.exports = {
  DESCRIPTION: 'Usa 100 monedas para obtener un ítem aleatorio',
  ALIASES: [],
  BOT_PERMISSIONS: [],
  PERMISSIONS: [],
  async execute(client, message) {
    const userData = await client.db.getUserData(message.author.id);
    if ((userData.money || 0) < 100) {
      return message.reply('Necesitas 100 monedas para usar el gacha.');
    }
    userData.money -= 100;
    if (!Array.isArray(userData.inventory)) userData.inventory = [];
    const reward = getRandomReward();
    userData.inventory.push(reward);
    await userData.save();
    message.reply(`🎁 Obtuviste: ${reward}`);
  },
};