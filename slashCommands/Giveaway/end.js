const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'end',
  description: 'Finalizar un sorteo activo por su ID de mensaje',
  memberpermissions: ['ManageMessages'],
  options: [
    { String: { name: 'message_id', description: 'ID del mensaje del sorteo', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    const messageId = interaction.options.getString('message_id')
    const giveaway = client.giveawaysManager.giveaways.find(
      g => g.messageId === messageId && g.guildId === interaction.guild.id
    )
    if (!giveaway) return interaction.reply({ embeds: [err(`${obeyUi.markup("icon.error")} No se encontró sorteo con ID: \`${messageId}\``)], ephemeral: true })
    if (giveaway.ended) return interaction.reply({ embeds: [err(obeyUi.owned('❌ El sorteo ya ha terminado.'))], ephemeral: true })
    try {
      await giveaway.end()
      await interaction.reply({ embeds: [ok(obeyUi.owned('🎉 ¡Sorteo finalizado!'))], ephemeral: true })
    } catch (e) {
      await interaction.reply({ embeds: [err(`${obeyUi.markup("icon.error")} Error: ${e.message}`)], ephemeral: true })
    }
  },
}
