const { EmbedBuilder } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')

module.exports = {
  name: 'unwarn',
  description: 'Eliminar una advertencia por número de caso',
  memberpermissions: ['KickMembers'],
  options: [
    { Integer: { name: 'caso', description: 'Número del caso a eliminar (ver con /moderation cases)', required: true } },
    { String:  { name: 'razon', description: 'Razón de la eliminación', required: false } },
  ],

  run: async (client, interaction) => {
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(d)], ephemeral: true })

    const caseId = interaction.options.getInteger('caso')
    const reason = interaction.options.getString('razon') || 'Sin razón'

    await interaction.deferReply({ ephemeral: true })

    const entry = await Moderation.findOne({ guildId: interaction.guild.id, caseId }).lean()
    if (!entry)
      return interaction.editReply(err(`❌ Caso **#${caseId}** no encontrado en este servidor.`))
    if (entry.action !== 'warn')
      return interaction.editReply(err(`❌ El caso **#${caseId}** es un **${entry.action}**, no una advertencia.`))

    await Moderation.updateOne({ _id: entry._id }, { $set: { active: false } })

    const target = await client.users.fetch(entry.userId).catch(() => null)

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle('✅ Advertencia eliminada')
        .addFields(
          { name: '🗂️ Caso',  value: `#${caseId}`,                              inline: true },
          { name: '👤 Usuario', value: target ? `${target.tag}` : entry.userId,  inline: true },
          { name: '📋 Razón original', value: entry.reason,                      inline: false },
          { name: '📝 Razón eliminación', value: reason,                         inline: false },
        )
        .setTimestamp()],
    })
  },
}
