const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'slowmode',
  description: 'Establecer el modo lento en un canal',
  memberpermissions: ['ManageChannels'],
  options: [
    { Integer: { name: 'segundos', description: 'Segundos entre mensajes (0 para desactivar, máx 21600)', required: true } },
    { Channel: { name: 'canal', description: 'Canal objetivo (por defecto: actual)', required: false } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    const seconds = interaction.options.getInteger('segundos')
    const channel = interaction.options.getChannel('canal') || interaction.channel

    if (seconds < 0 || seconds > 21600)
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ El valor debe estar entre 0 y 21600 segundos.'))], ephemeral: true })

    if (!channel.permissionsFor(interaction.guild.members.me).has('ManageChannels'))
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ No tengo permisos para gestionar ese canal.'))], ephemeral: true })

    await channel.setRateLimitPerUser(seconds)
    const msg = seconds === 0
      ? `${obeyUi.markup("icon.slow")} Modo lento **desactivado** en ${channel}.`
      : `${obeyUi.markup("icon.slow")} Modo lento de **${seconds}s** activado en ${channel}.`
    await interaction.reply({ embeds: [ok(msg)], ephemeral: true })
  },
}
