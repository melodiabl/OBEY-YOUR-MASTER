const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'vkick',
  description: 'Desconectar a un miembro de su canal de voz',
  memberpermissions: ['MoveMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a desconectar', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    const user = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'Sin razón'
    const member = await interaction.guild.members.fetch(user.id).catch(() => null)
    if (!member) return interaction.reply({ embeds: [err(obeyUi.owned('❌ Usuario no encontrado.'))], ephemeral: true })
    if (!member.voice.channel) return interaction.reply({ embeds: [err(obeyUi.owned('❌ El usuario no está en un canal de voz.'))], ephemeral: true })
    if (!interaction.guild.members.me.permissions.has('MoveMembers'))
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ No tengo permisos para mover miembros.'))], ephemeral: true })

    await member.voice.disconnect(reason)
    await interaction.reply({ embeds: [ok(`${obeyUi.markup("icon.shoe")} ${user} fue **desconectado** del canal de voz.\n> Razón: ${reason}`)], ephemeral: true })
  },
}
