const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Muestra tu perfil económico')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo perfil quieres ver')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const userData = await client.db.getUserData(user.id);
    const money = userData.money || 0;
    const bank = userData.bank || 0;
    const partner = userData.partner ? `<@${userData.partner}>` : 'Soltero/a';
    const items = userData.inventory || [];
    let msg = `**Perfil de ${user.username}**\n`;
    msg += `💰 Dinero en mano: **${money}**\n`;
    msg += `🏦 Banco: **${bank}**\n`;
    msg += `💍 Pareja: ${partner}\n`;
    msg += `🎒 Inventario: ${items.length ? items.join(', ') : 'Vacío'}`;
    await interaction.reply(msg);
  },
};
