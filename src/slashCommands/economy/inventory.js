const { SlashCommandBuilder } = require('discord.js')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed } = require('../../core/ui/interactionKit')

function itemEmoji (item) {
  const e = item?.meta?.emoji
  return e ? String(e) : Emojis.inventory
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Muestra tu inventario (persistente)'),

  async execute (client, interaction) {
    const inv = await Systems.items.getUserInventory({ userID: interaction.user.id }).catch(() => [])
    const entries = Array.isArray(inv) ? inv : []

    const itemEntries = entries
      .filter(x => x && typeof x === 'object' && x.itemId && Number(x.qty || 0) > 0)
      .slice(0, 25)

    const legacyEntries = entries
      .filter(x => typeof x === 'string' && x.trim())
      .slice(0, Math.max(0, 25 - itemEntries.length))

    const ids = itemEntries.map(e => String(e.itemId))
    const items = await Systems.items.getItemsByIds(ids).catch(() => [])
    const map = new Map(items.map(it => [String(it.itemId), it]))

    const totalQty = itemEntries.reduce((acc, e) => acc + Math.max(0, Number(e.qty || 0)), 0)

    const lines = []
    for (const e of itemEntries) {
      const it = map.get(String(e.itemId))
      const name = it ? it.name : String(e.itemId)
      lines.push(`${Emojis.dot} ${itemEmoji(it)} ${Format.bold(name)} x${Format.inlineCode(String(e.qty))} ${Format.subtext(String(e.itemId))}`)
    }
    for (const s of legacyEntries) {
      lines.push(`${Emojis.dot} ${Emojis.inventory} ${Format.bold('Legacy')} ${Format.subtext(String(s).slice(0, 60))}`)
    }

    if (!lines.length) {
      lines.push(`${Emojis.dot} ${Format.italic('Vacio')}`)
    }

    return replyEmbed(client, interaction, {
      system: 'inventory',
      kind: 'info',
      title: `${Emojis.inventory} Inventario`,
      description: [
        headerLine(Emojis.inventory, interaction.user.username),
        `${Emojis.dot} Items (distintos): ${Format.inlineCode(String(itemEntries.length))} ${Emojis.dot} Cantidad: ${Format.inlineCode(String(totalQty))}`,
        Format.softDivider(20),
        lines.join('\n'),
        entries.length > 25 ? Format.subtext(`Y ${entries.length - 25} mas...`) : null
      ].filter(Boolean).join('\n'),
      signature: 'Inventario real (DB)'
    }, { ephemeral: true })
  }
}
