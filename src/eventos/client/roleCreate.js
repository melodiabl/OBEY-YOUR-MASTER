const systems = require('../../systems')

module.exports = async (client, role) => {
  if (!role?.guild) return
  await systems.logs.sendLog(role.guild, 'roleCreate', { role })
}

