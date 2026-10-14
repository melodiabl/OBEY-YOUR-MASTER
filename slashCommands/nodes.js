module.exports = {
  name: 'nodes', category: 'Music', description: 'Consulta y elige las conexiones de música del servidor.',
  memberpermissions: ['ManageGuild'], defaultMemberPermissions: '32', guildOnly: true, cooldown: 5,
  options: [{ String: { name: 'connection', description: 'auto o el ID de una conexión pública disponible', required: false } }],
  run: (client, interaction) => require('../handlers/music/nodes-command')(client, interaction, interaction.options.getString('connection')),
}
