const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Crea una encuesta con botones')
    .addStringOption(option =>
      option.setName('pregunta')
        .setDescription('La pregunta de la encuesta')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opcion1')
        .setDescription('Primera opción')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('opcion2')
        .setDescription('Segunda opción')
        .setRequired(true)),

  async execute (client, interaction) {
    const question = interaction.options.getString('pregunta')
    const op1 = interaction.options.getString('opcion1')
    const op2 = interaction.options.getString('opcion2')

    const embed = new EmbedBuilder()
      .setTitle('📊 Encuesta')
      .setDescription(`**${question}**\n\n1️⃣ ${op1}\n2️⃣ ${op2}`)
      .setColor('Blue')
      .setFooter({ text: `Creada por ${interaction.user.tag}` })
      .setTimestamp()

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('poll_1')
          .setLabel(op1.substring(0, 80))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('poll_2')
          .setLabel(op2.substring(0, 80))
          .setStyle(ButtonStyle.Secondary)
      )

    await interaction.reply({ embeds: [embed], components: [row] })
  }
}
