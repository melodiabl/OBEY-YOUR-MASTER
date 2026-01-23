const { ActivityType, PresenceUpdateStatus } = require('discord.js')
const { abbreviateNumber } = require('../../helpers/helpers')
const GuildDB = require('../../database/schemas/Guild.db')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk } = require('../../core/ui/messageKit')

module.exports = {
  DESCRIPTION: 'Actualiza la presencia del bot (owner)',
  OWNER: true,
  async execute (client, message) {
    const servers = abbreviateNumber(new GuildDB().getGuildAllData().length)
    client.user.setPresence({
      activities: [{ name: `${servers} servers • /panel`, type: ActivityType.Watching }],
      status: PresenceUpdateStatus.Online
    })

    return replyOk(client, message, {
      system: 'info',
      title: `${Emojis.success} Presencia actualizada`,
      lines: [
        `${Emojis.dot} Actividad: ${Format.inlineCode('Watching')}`,
        `${Emojis.dot} Texto: ${Format.inlineCode(`${servers} servers • /panel`)}`
      ]
    })
  }
}

