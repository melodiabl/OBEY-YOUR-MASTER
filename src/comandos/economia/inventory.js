const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Muestra tu inventario',
  ALIASES: ['inv'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const items = Array.isArray(userData.inventory) ? userData.inventory : []
    const shown = items.slice(0, 25)

    const lines = shown.length
      ? shown.map((it, i) => `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${Format.inlineCode(String(it))}`)
      : [`${Emojis.dot} ${Format.italic('Vacío')}`]

    return replyEmbed(client, message, {
      system: 'inventory',
      kind: 'info',
      title: `${Emojis.inventory} Inventario`,
      description: [
        headerLine(Emojis.inventory, message.author.username),
        `${Emojis.dot} Items: ${Format.inlineCode(items.length)}`,
        Format.softDivider(20),
        lines.join('\n'),
        items.length > 25 ? Format.subtext(`Y ${items.length - 25} más…`) : null
      ].filter(Boolean).join('\n'),
      signature: 'Colección viva'
    })
  }
}

