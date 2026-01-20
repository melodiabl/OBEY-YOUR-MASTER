const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { proposeMarriage } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propone matrimonio a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario al que quieres proponer matrimonio')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario')

    if (user.bot) return interaction.reply({ content: `${Emojis.error} No puedes casarte con un bot.`, ephemeral: true })

    const result = await proposeMarriage(interaction.user.id, user.id, client.db)

    if (!result.ok) {
      return interaction.reply({
        content: `${Emojis.error} ${result.message || 'No se pudo proponer matrimonio.'}`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setTitle(Format.title('💍', 'Propuesta de Matrimonio'))
      .setDescription(`${interaction.user} le ha propuesto matrimonio a ${user}!`)
      .setColor('LuminousVividPink')
      .addFields({ name: 'Estado', value: `${Emojis.loading} Esperando respuesta...` })
      .setFooter({ text: 'Usa /accept para aceptar la propuesta' })
      .setTimestamp()

    await interaction.reply({ content: `${user}`, embeds: [embed] })
  }
}
