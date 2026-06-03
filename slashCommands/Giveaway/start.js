const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const ms = require('ms')
module.exports = {
  name: 'start',
  description: 'Iniciar un nuevo sorteo en un canal',
  memberpermissions: ['ManageMessages'],
  options: [
    { Channel: { name: 'canal', description: 'Canal donde iniciar el sorteo', required: true } },
    { String: { name: 'duracion', description: 'Duración (ej: 1d, 12h, 30m)', required: true } },
    { String: { name: 'premio', description: 'Premio del sorteo', required: true } },
    { Integer: { name: 'ganadores', description: 'Número de ganadores', required: true } },
    { Role: { name: 'rol_requerido', description: 'Rol requerido para participar', required: false } },
  ],
  run: async (client, interaction) => {
    const channel = interaction.options.getChannel('canal')
    const durationStr = interaction.options.getString('duracion')
    const prize = interaction.options.getString('premio')
    const winners = interaction.options.getInteger('ganadores')
    const role = interaction.options.getRole('rol_requerido')

    const duration = ms(durationStr)
    if (!duration || duration < 5000)
      return interaction.reply({ content: '❌ Duración inválida. Usa formatos como `1d`, `12h`, `30m`.', ephemeral: true })

    if (winners < 1 || winners > 20)
      return interaction.reply({ content: '❌ Los ganadores deben ser entre 1 y 20.', ephemeral: true })

    if (channel.type !== ChannelType.GuildText)
      return interaction.reply({ content: '❌ Solo puedes iniciar sorteos en canales de texto.', ephemeral: true })

    const options = {
      duration,
      prize,
      winnerCount: winners,
      hostedBy: interaction.user,
      messages: {
        giveaway: '🎉 **SORTEO** 🎉',
        giveawayEnded: '🎉 **SORTEO FINALIZADO** 🎉',
        inviteToParticipate: 'Reacciona con 🎉 para participar',
        drawing: '¡Sorteo en {timestamp}!',
        hostedBy: `\nOrganizado por: {this.hostedBy}`,
        noWinner: 'Sin ganadores, no hubo participantes válidos.',
        winners: '¡Ganador(es)!',
        endedAt: 'Finalizado en',
      },
    }

    if (role) {
      options.exemptMembers = m => !m.roles.cache.has(role.id)
    }

    try {
      await client.giveawaysManager.start(channel, options)
      await interaction.reply({ content: `✅ ¡Sorteo iniciado en ${channel}!`, ephemeral: true })
    } catch (e) {
      await interaction.reply({ content: `❌ Error al iniciar: ${e.message}`, ephemeral: true })
    }
  },
}
