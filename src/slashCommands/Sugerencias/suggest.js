const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const GuildSchema = require('../../database/schemas/GuildSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Envía una sugerencia al servidor')
    .addStringOption(option =>
      option.setName('sugerencia')
        .setDescription('Tu sugerencia')
        .setRequired(true)),

  async execute (client, interaction) {
    const suggestion = interaction.options.getString('sugerencia')
    const guildData = await GuildSchema.findOne({ guildID: interaction.guild.id })

    if (!guildData || !guildData.suggestionChannel) {
      return interaction.reply({ content: '❌ El sistema de sugerencias no está configurado en este servidor.', ephemeral: true })
    }

    const channel = interaction.guild.channels.cache.get(guildData.suggestionChannel)
    if (!channel) return interaction.reply({ content: '❌ El canal de sugerencias no existe.', ephemeral: true })

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Sugerencia de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(suggestion)
      .setColor('Yellow')
      .addFields({ name: 'Estado', value: '⏳ Pendiente' })
      .setFooter({ text: 'Vota usando las reacciones' })
      .setTimestamp()

    const msg = await channel.send({ embeds: [embed] })
    await msg.react('✅')
    await msg.react('❌')

    await interaction.reply({ content: '✅ Tu sugerencia ha sido enviada.', ephemeral: true })
  }
}
