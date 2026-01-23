const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Mostrar el avatar de un usuario',
  ALIASES: ['av'],
  async execute (client, message) {
    const member = message.mentions.members.first() || message.member
    const user = member.user
    const url = user.displayAvatarURL({ size: 1024 })

    return replyEmbed(client, message, {
      system: 'utility',
      kind: 'info',
      title: `${Emojis.human} Avatar`,
      description: [
        headerLine(Emojis.utility, user.tag),
        `${Emojis.dot} **ID:** ${Format.inlineCode(user.id)}`
      ].join('\n'),
      image: url
    })
  }
}

