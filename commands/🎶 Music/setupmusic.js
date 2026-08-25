const { EmbedBuilder, PermissionFlagsBits } = require('discord.js')
const setup = require('../../handlers/music/setup')

module.exports = {
  name: 'setupmusic',
  category: '🎶 Music',
  aliases: ['setup-music', 'musicsetup', 'canalmusica'],
  description: 'Crea o elimina un canal de peticiones de música (estilo Soundy)',
  usage: 'setupmusic [create|delete]',
  run: async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Necesitas el permiso **Gestionar Canales**.')] }).catch(() => {})
    }
    const sub = (args[0] || 'create').toLowerCase()

    if (['delete', 'remove', 'borrar', 'quitar'].includes(sub)) {
      const r = await setup.remove(client, message.guild)
      return message.reply({ embeds: [new EmbedBuilder().setColor(r.ok ? 0x00ff33 : 0xED4245)
        .setDescription(r.ok ? '✅ Canal de peticiones eliminado.' : '❌ No hay canal de peticiones configurado.')] }).catch(() => {})
    }

    const r = await setup.create(client, message.guild)
    if (r.ok) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x00ff33)
        .setDescription(`✅ Canal de peticiones creado: <#${r.channelId}>\nEscribe ahí el nombre o link de una canción para reproducirla.`)] }).catch(() => {})
    }
    if (r.reason === 'exists') {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
        .setDescription(`❌ Ya existe un canal de peticiones: <#${r.channelId}>. Usa \`${message.client?.prefix || '!'}setupmusic delete\` para quitarlo.`)] }).catch(() => {})
    }
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245)
      .setDescription('❌ No pude crear el canal. ¿Tengo permiso para **Gestionar Canales**?')] }).catch(() => {})
  },
}
