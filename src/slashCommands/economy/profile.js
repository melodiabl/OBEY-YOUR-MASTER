const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Muestra tu perfil detallado'),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)

    const money = userData.money || 0
    const bank = userData.bank || 0
    const total = money + bank
    const partner = userData.partner ? `<@${userData.partner}>` : 'Soltero/a'
    const items = userData.inventory || []

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Perfil de ${user.username}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
      .setColor('LuminousVividPink')
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        {
          name: `${Emojis.economy} Economía`,
          value: [
            `${Emojis.money} ${Format.bold('Efectivo:')} ${Format.inlineCode(money.toLocaleString())}`,
            `${Emojis.bank} ${Format.bold('Banco:')} ${Format.inlineCode(bank.toLocaleString())}`,
            `${Emojis.stats} ${Format.bold('Total:')} ${Format.inlineCode(total.toLocaleString())}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.member} Social`,
          value: [
            `${Emojis.dot} ${Format.bold('Pareja:')} ${partner}`,
            `${Emojis.level} ${Format.bold('Nivel:')} ${userData.level || 0}`,
            `${Emojis.star} ${Format.bold('Rep:')} ${userData.rep || 0}`
          ].join('\n'),
          inline: true
        },
        {
          name: `${Emojis.inventory} Inventario (${items.length})`,
          value: items.length > 0
            ? Format.subtext(items.slice(0, 10).join(', ') + (items.length > 10 ? '...' : ''))
            : Format.italic('El inventario está vacío'),
          inline: false
        }
      )
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
