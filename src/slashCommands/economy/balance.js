const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Muestra tu saldo actual')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Ver el saldo de otro usuario')
        .setRequired(false)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.economy} Saldo de ${user.username}`)
      .setColor('Gold')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: `${Emojis.money} Efectivo`,
          value: Format.inlineCode(userData.money?.toLocaleString() || '0'),
          inline: true
        },
        {
          name: `${Emojis.bank} Banco`,
          value: Format.inlineCode(userData.bank?.toLocaleString() || '0'),
          inline: true
        },
        {
          name: `${Emojis.stats} Total`,
          value: Format.bold(((userData.money || 0) + (userData.bank || 0)).toLocaleString()),
          inline: false
        }
      )
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
