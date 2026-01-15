const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('gacha')
    .setDescription('Gira la ruleta para obtener un ítem al azar'),
  async execute(client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id);
    const cost = 100;
    if ((userData.money || 0) < cost) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero para jugar gacha.', ephermal: true });
    }
    userData.money -= cost;
    const pool = [
      { name: 'Común 🌱', weight: 50 },
      { name: 'Raro 🌟', weight: 30 },
      { name: 'Épico 🔮', weight: 15 },
      { name: 'Legendario 🏆', weight: 5 },
    ];
    const total = pool.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * total;
    let result;
    for (const item of pool) {
      if (rand < item.weight) {
        result = item.name;
        break;
      }
      rand -= item.weight;
    }
    userData.inventory = userData.inventory || [];
    userData.inventory.push(result);
    await userData.save();
    await interaction.reply(`🎰 Has obtenido: **${result}**!`);
  },
};
