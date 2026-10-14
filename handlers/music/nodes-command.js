const { PermissionFlagsBits, EmbedBuilder } = require('discord.js')
module.exports = async function nodesCommand(client, context, nodeId) {
  const slash = Boolean(context.commandName)
  const reply = payload => slash ? context.editReply(payload) : context.reply(payload)
  if (slash) await context.deferReply({ ephemeral: true })
  const member = await context.guild?.members.fetch(context.user?.id || context.author?.id).catch(() => null)
  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) return reply({ content: 'Necesitas permiso para administrar este servidor.' })
  try {
    const view = nodeId ? await client.music.setNodePreference(context.guild.id, nodeId) : client.music.getNodes(context.guild.id)
    if (!view) throw Error('nodes_unavailable')
    const labels = { online: 'Disponible', offline: 'Sin conexión', connecting: 'Conectando', disabled: 'Desactivada' }
    const preference = view.nodes.find(node => node.id === view.preferenceId)?.label || 'Automático'
    const current = view.nodes.find(node => node.id === view.currentId)?.label || 'Automático'
    const rows = view.nodes.map(node => `**${node.label}** · ${labels[node.status] || 'Sin conexión'} · \`${node.id}\``)
    return reply({ embeds: [new EmbedBuilder().setColor(0x98a3ff).setTitle('Conexiones de música')
      .setDescription(`Preferencia: **${preference}**\nConexión actual: **${current}**\n\n${rows.join('\n') || 'Aún no hay conexiones públicas configuradas.'}\n\nUsa \`nodes auto\` o \`nodes ID\` para guardar una preferencia.`)] })
  } catch { return reply({ content: 'No se pudo aplicar la selección. Consulta las conexiones disponibles y vuelve a intentarlo.' }) }
}
