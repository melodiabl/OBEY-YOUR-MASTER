const obeyUi = require("../../handlers/assets/system")
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
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Necesitas el permiso **Gestionar Canales**.'), 4096))], ephemeral: true }).catch(() => {})
    }
    await interaction.deferReply({ ephemeral: true })
    const action = interaction.options.getString('accion') || 'create'

    if (action === 'delete') {
      const r = await setup.remove(client, interaction.guild)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(r.ok ? 0x00ff33 : 0xED4245)
        .setDescription(obeyUi.limit(r.ok ? obeyUi.owned('✅ Canal de peticiones eliminado.') : obeyUi.owned('❌ No hay canal de peticiones configurado.'), 4096))] }).catch(() => {})
    }

    const r = await setup.create(client, interaction.guild)
    if (r.ok) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x00ff33)
        .setDescription(obeyUi.limit(`${obeyUi.markup("icon.success")} Canal de peticiones creado: <#${r.channelId}>\nEscribe ahí el nombre o link de una canción para reproducirla.`, 4096))] }).catch(() => {})
    }
    if (r.reason === 'exists') {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} Ya existe un canal de peticiones: <#${r.channelId}>.`, 4096))] }).catch(() => {})
    }
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
      .setDescription(obeyUi.limit(obeyUi.owned('❌ No pude crear el canal. ¿Tengo permiso para **Gestionar Canales**?'), 4096))] }).catch(() => {})
  },
}
