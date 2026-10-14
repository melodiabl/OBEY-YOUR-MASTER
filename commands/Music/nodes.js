module.exports = {
  name: 'nodes', category: 'Music', aliases: ['nodos'], description: 'Consulta y elige las conexiones de música del servidor.', usage: 'nodes [auto o ID público]',
  memberpermissions: ['ManageGuild'], cooldown: 5,
  run: (client, message, args) => require('../../handlers/music/nodes-command')(client, message, args[0]),
}
