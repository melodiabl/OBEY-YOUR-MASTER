// /config setupmusic — crea o elimina el canal de peticiones de música (estilo Soundy).
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const setup = require('../../handlers/music/setup')

module.exports = {
  name: 'setupmusic',
  description: 'Crea o elimina un canal de peticiones de música (estilo Soundy)',
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: 'Crear o eliminar el canal',
        required: false,
        choices: [['Crear', 'create'], ['Eliminar', 'delete']],
      },
    },
  ],
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Necesitas el permiso **Gestionar Canales**.')], ephemeral: true }).catch(() => {})
    }
    await interaction.deferReply({ ephemeral: true })
    const action = interaction.options.getString('accion') || 'create'

    if (action === 'delete') {
      const r = await setup.remove(client, interaction.guild)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(r.ok ? 0x00ff33 : 0xED4245)
        .setDescription(r.ok ? '✅ Canal de peticiones eliminado.' : '❌ No hay canal de peticiones configurado.')] }).catch(() => {})
    }

    const r = await setup.create(client, interaction.guild)
    if (r.ok) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00ff33)
        .setDescription(`✅ Canal de peticiones creado: <#${r.channelId}>\nEscribe ahí el nombre o link de una canción para reproducirla.`)] }).catch(() => {})
    }
    if (r.reason === 'exists') {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(`❌ Ya existe un canal de peticiones: <#${r.channelId}>.`)] }).catch(() => {})
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
      .setDescription('❌ No pude crear el canal. ¿Tengo permiso para **Gestionar Canales**?')] }).catch(() => {})
  },
}
