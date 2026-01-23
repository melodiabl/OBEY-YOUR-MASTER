const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { cleanId } = require('../../core/commands/legacyArgs')

function ts (d) {
  try {
    return `<t:${Math.floor(new Date(d).getTime() / 1000)}:R>`
  } catch (e) {
    return Format.inlineCode('n/a')
  }
}

module.exports = {
  DESCRIPTION: 'Muestra info de un canal.',
  ALIASES: ['ci', 'channel'],
  async execute (client, message, args) {
    const token = String(args?.[0] || '').trim()
    const id = cleanId(token)
    const mentioned = message.mentions.channels.first()
    const channel = mentioned || (id ? message.guild.channels.cache.get(id) : null) || message.channel

    if (!channel) {
      return replyError(client, message, {
        system: 'info',
        title: 'Canal inválido',
        reason: 'No pude encontrar ese canal.'
      })
    }

    const fields = [
      { name: `${Emojis.id} ID`, value: Format.inlineCode(channel.id), inline: true },
      { name: `${Emojis.category} Tipo`, value: Format.inlineCode(String(channel.type)), inline: true },
      { name: `${Emojis.calendar} Creado`, value: ts(channel.createdAt), inline: true }
    ]

    if (typeof channel.nsfw === 'boolean') {
      fields.push({ name: `${Emojis.warn} NSFW`, value: channel.nsfw ? 'Sí' : 'No', inline: true })
    }
    if (channel.parent) {
      fields.push({ name: `${Emojis.category} Categoría`, value: channel.parent.toString(), inline: true })
    }
    if (typeof channel.topic === 'string' && channel.topic.trim()) {
      fields.push({ name: `${Emojis.quote} Topic`, value: Format.quote(channel.topic.slice(0, 400)), inline: false })
    }

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.channel} Channel Info`,
      description: [headerLine(Emojis.channel, channel.name || 'Canal'), `${Emojis.dot} ${channel}`].join('\n'),
      fields,
      signature: 'Información de canal'
    })
  }
}
