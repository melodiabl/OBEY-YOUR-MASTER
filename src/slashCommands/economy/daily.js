const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria'),
  async execute(client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id);
    const cooldown = userData.dailyCooldown || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (cooldown && now - cooldown < oneDay) {
      const remaining = Math.ceil((oneDay - (now - cooldown)) / (60 * 60 * 1000));
      return interaction.reply({ content: `⏳ Debes esperar ${remaining} horas para volver a reclamar tu recompensa diaria.`, ephermal: true });
    }
    const amount = Math.floor(Math.random() * 201) + 100; // 100-300
    userData.money = (userData.money || 0) + amount;
    userData.dailyCooldown = now;
    await userData.save();
    await interaction.reply(`🎁 Has reclamado tu recompensa diaria y obtenido **${amount} monedas**. Tienes ahora **${userData.money}** monedas.`);
  },
};
