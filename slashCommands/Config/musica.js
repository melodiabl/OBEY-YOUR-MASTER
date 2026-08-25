const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'musica',
  description: 'Activar o desactivar el sistema de música',
  memberpermissions: ['ManageGuild'],
  options: [
    {
      StringChoices: {
        name: 'estado',
        description: '¿Activar o desactivar la música?',
        required: true,
        choices: [
          ['Activar',  'on'],
          ['Desactivar', 'off'],
          ['Ver estado', 'status'],
        ],
      },
    },
  ],

  run: async (client, interaction) => {
    const gid    = interaction.guild.id
    const estado = interaction.options.getString('estado')

    if (estado === 'status') {
      const enabled = !!client.settings.get(gid, 'MUSIC')
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(enabled ? 0x22C55E : 0x6B7280)
          .setTitle('🎵 Sistema de Música')
          .setDescription(enabled ? '✅ **Activado**' : '❌ **Desactivado**')],
        ephemeral: true,
      })
    }

    const enable = estado === 'on'
    client.settings.set(gid, enable, 'MUSIC')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(enable ? 0x22C55E : 0x6B7280)
        .setTitle('🎵 Sistema de Música')
        .setDescription(enable
          ? '✅ Música **activada**. Los usuarios pueden usar `!play`, `/music play`, etc.'
          : '❌ Música **desactivada**. Los comandos de música están bloqueados.')
        .setFooter({ text: `Cambiado por ${interaction.user.tag}` })],
    })
  },
}
