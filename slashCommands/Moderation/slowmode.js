module.exports = {
  name: 'slowmode',
  description: 'Establecer el modo lento en un canal',
  memberpermissions: ['ManageChannels'],
  options: [
    { Integer: { name: 'segundos', description: 'Segundos entre mensajes (0 para desactivar, máx 21600)', required: true } },
    { Channel: { name: 'canal', description: 'Canal objetivo (por defecto: actual)', required: false } },
  ],
  run: async (client, interaction) => {
    const seconds = interaction.options.getInteger('segundos')
    const channel = interaction.options.getChannel('canal') || interaction.channel

    if (seconds < 0 || seconds > 21600)
      return interaction.reply({ content: '❌ El valor debe estar entre 0 y 21600 segundos.', ephemeral: true })

    if (!channel.permissionsFor(interaction.guild.members.me).has('ManageChannels'))
      return interaction.reply({ content: '❌ No tengo permisos para gestionar ese canal.', ephemeral: true })

    await channel.setRateLimitPerUser(seconds)
    const msg = seconds === 0
      ? `✅ Modo lento desactivado en ${channel}.`
      : `✅ Modo lento de **${seconds}s** activado en ${channel}.`
    await interaction.reply({ content: msg, ephemeral: true })
  },
}
