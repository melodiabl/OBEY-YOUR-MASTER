const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'logs',
  description: 'Configurar el canal de logs de moderación',
  memberpermissions: ['ManageGuild'],
  options: [
    { Channel: { name: 'canal', description: 'Canal donde se enviarán los logs (déjalo vacío para desactivar)', required: false } },
  ],

  run: async (client, interaction) => {
    const channel = interaction.options.getChannel('canal')
    const gid     = interaction.guild.id

    if (!channel) {
      client.settings.set(gid, 'no', 'logger.channel')
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xF97316)
          .setDescription('🔕 Logs de moderación **desactivados**.')],
        ephemeral: true,
      })
    }

    if (!channel.isTextBased())
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debe ser un canal de texto.')],
        ephemeral: true,
      })

    client.settings.set(gid, channel.id, 'logger.channel')

    const current = client.settings.get(gid, 'logger') || {}
    const enabled = Object.entries(current)
      .filter(([k, v]) => k !== 'channel' && v === true)
      .map(([k]) => `\`${k}\``)

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle('✅ Canal de logs configurado')
        .addFields(
          { name: '📢 Canal',   value: `${channel}`,                                  inline: true },
          { name: '🔔 Eventos', value: enabled.length ? enabled.join(', ') : '*(usar `!setup-logger` para activar eventos)*', inline: false },
        )
        .setFooter({ text: 'Usa !setup-logger para configurar los eventos de log' })],
    })
  },
}
