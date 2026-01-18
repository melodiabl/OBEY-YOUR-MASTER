const { registerOverflowForGuild } = require('../../core/commands/registerSlashCommands')

module.exports = async (client, guild) => {
  try {
    await registerOverflowForGuild(client, guild)
  } catch (e) {}
}
