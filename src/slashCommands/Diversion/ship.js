const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Mide la compatibilidad entre dos usuarios')
    .addUserOption(option => option.setName('usuario1').setDescription('Primer usuario').setRequired(true))
    .addUserOption(option => option.setName('usuario2').setDescription('Segundo usuario').setRequired(false)),

  async execute (client, interaction) {
    const user1 = interaction.options.getUser('usuario1')
    const user2 = interaction.options.getUser('usuario2') || interaction.user

    const lovePercentage = Math.floor(Math.random() * 101)
    let loveDescription = ''

    if (lovePercentage > 80) loveDescription = '❤️ ¡Son el uno para el otro!'
    else if (lovePercentage > 50) loveDescription = '💖 Hay una buena conexión.'
    else if (lovePercentage > 20) loveDescription = '💔 Podría funcionar, pero será difícil.'
    else loveDescription = '💀 Mejor sigan siendo amigos... o ni eso.'

    const embed = new EmbedBuilder()
      .setTitle('💘 Medidor de Amor')
      .setDescription(`La compatibilidad entre **${user1.username}** y **${user2.username}** es del:\n\n**${lovePercentage}%**\n\n${loveDescription}`)
      .setColor('LuminousVividPink')
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
