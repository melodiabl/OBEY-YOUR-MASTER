const obeyUi = require("../../handlers/assets/system")
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
    const err = d => ({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))], ephemeral: true })

    const caseId = interaction.options.getInteger('caso')
    const reason = interaction.options.getString('razon') || 'Sin razón'

    await interaction.deferReply({ ephemeral: true })

    const entry = await Moderation.findOne({ guildId: interaction.guild.id, caseId }).lean()
    if (!entry)
      return interaction.editReply(err(`${obeyUi.markup("icon.error")} Caso **#${caseId}** no encontrado en este servidor.`))
    if (entry.action !== 'warn')
      return interaction.editReply(err(`${obeyUi.markup("icon.error")} El caso **#${caseId}** es un **${entry.action}**, no una advertencia.`))

    await Moderation.updateOne({ _id: entry._id }, { $set: { active: false } })

    const target = await client.users.fetch(entry.userId).catch(() => null)

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle(obeyUi.limit(obeyUi.owned('✅ Advertencia eliminada'), 256))
        .addFields(
          { name: obeyUi.owned('🗂️ Caso'),  value: `#${caseId}`,                              inline: true },
          { name: obeyUi.owned('👤 Usuario'), value: target ? `${target.tag}` : entry.userId,  inline: true },
          { name: obeyUi.owned('📋 Razón original'), value: entry.reason,                      inline: false },
          { name: obeyUi.owned('📝 Razón eliminación'), value: reason,                         inline: false },
        )
        .setTimestamp()],
    })
  },
}
