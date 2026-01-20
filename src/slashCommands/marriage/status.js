const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Muestra tu estado de matrimonio')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo estado quieres ver')
        .setRequired(false)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)
    const partnerId = userData.partner

    const embed = new EmbedBuilder()
      .setTitle(`👰 Estado Civil de ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp()

    if (!partnerId) {
      embed.setColor('Grey')
      embed.setDescription(`${user} se encuentra ${Format.bold('soltero/a')} en este momento.`)
    } else {
      embed.setColor('LuminousVividPink')
      embed.setDescription(`${user} está ${Format.bold('casado/a')} con <@${partnerId}>.`)
      embed.addFields({ name: 'Compañero/a', value: `${Emojis.crown} <@${partnerId}>` })
    }

    await interaction.reply({ embeds: [embed] })
  }
}
