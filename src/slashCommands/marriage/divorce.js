const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { divorce } = require('../../utils/marriageManager')
const Emojis = require('../../utils/emojis')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Solicita un divorcio'),
  async execute (client, interaction) {
    const ok = await divorce(interaction.user.id, client.db)

    if (!ok) {
      return interaction.reply({
        content: `${Emojis.error} No estás casado/a actualmente.`,
        ephemeral: true
      })
    }

    const embed = new EmbedBuilder()
      .setTitle('💔 Matrimonio Finalizado')
      .setDescription('Has decidido terminar tu relación.')
      .setColor('Grey')
      .addFields({ name: 'Estado', value: 'Ahora vuelves a estar soltero/a.' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
