const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra la lista de comandos (legacy prefix).',
  ALIASES: ['ayuda', 'h'],
  async execute (client, message, args, prefix) {
    const p = String(prefix || '!').trim() || '!'

    const categories = [
      { name: `${Emojis.info} Información`, value: `${Format.inlineCode(`${p}ping`)}, ${Format.inlineCode(`${p}serverinfo`)}, ${Format.inlineCode(`${p}help`)}`, inline: true },
      { name: `${Emojis.economy} Economía`, value: `${Format.inlineCode(`${p}balance`)}, ${Format.inlineCode(`${p}work`)}, ${Format.inlineCode(`${p}daily`)}, ${Format.inlineCode(`${p}profile`)}`, inline: true },
      { name: `${Emojis.music} Música`, value: `${Format.inlineCode(`${p}play`)}, ${Format.inlineCode(`${p}skip`)}, ${Format.inlineCode(`${p}stop`)}, ${Format.inlineCode(`${p}queue`)}`, inline: true },
      { name: `${Emojis.system} Sistemas`, value: `${Format.inlineCode('/panel')} ${Emojis.dot} ${Format.inlineCode('/help')} ${Emojis.dot} ${Format.inlineCode('/sistemas')}`, inline: true }
    ]

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.crown} OBEY YOUR MASTER`,
      description: [
        headerLine(Emojis.info, 'Ayuda (modo compat)'),
        `${Emojis.dot} Hola ${Format.bold(message.author.username)}.`,
        `${Emojis.dot} Para la experiencia premium: ${Format.inlineCode('/panel')} y ${Format.inlineCode('/help')}.`
      ].join('\n'),
      fields: categories,
      signature: 'El futuro es slash ✨'
    })
  }
}

