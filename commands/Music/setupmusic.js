const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const setup = require('../../handlers/music/setup')

module.exports = {
  name: 'setupmusic',
  category: 'Music',
  aliases: ['setup-music', 'musicsetup', 'canalmusica'],
  description: 'Crea o elimina un canal de peticiones de música (estilo Soundy)',
  usage: 'setupmusic [create|delete]',
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Necesitas el permiso **Gestionar Canales**.'), 4096))] }).catch(() => {})
    }
    const sub = (args[0] || 'create').toLowerCase()

    if (['delete', 'remove', 'borrar', 'quitar'].includes(sub)) {
      const r = await setup.remove(client, message.guild)
      return message.reply({ embeds: [new EmbedBuilder().setColor(r.ok ? 0x00ff33 : 0xED4245)
        .setDescription(obeyUi.limit(r.ok ? obeyUi.owned('✅ Canal de peticiones eliminado.') : obeyUi.owned('❌ No hay canal de peticiones configurado.'), 4096))] }).catch(() => {})
    }

    const r = await setup.create(client, message.guild)
    if (r.ok) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x00ff33)
        .setDescription(obeyUi.limit(`${obeyUi.markup("icon.success")} Canal de peticiones creado: <#${r.channelId}>\nEscribe ahí el nombre o link de una canción para reproducirla.`, 4096))] }).catch(() => {})
    }
    if (r.reason === 'exists') {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} Ya existe un canal de peticiones: <#${r.channelId}>. Usa \`${message.client?.prefix || '!'}setupmusic delete\` para quitarlo.`, 4096))] }).catch(() => {})
    }
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
      .setDescription(obeyUi.limit(obeyUi.owned('❌ No pude crear el canal. ¿Tengo permiso para **Gestionar Canales**?'), 4096))] }).catch(() => {})
  },
}
