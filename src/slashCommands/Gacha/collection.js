const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Muestra tu colección de objetos del Gacha'),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const inv = Array.isArray(userData?.inventory) ? userData.inventory : []

    const gachaItems = inv
      .map(it => (typeof it === 'string' ? it : it?.name))
      .filter(Boolean)

    if (!gachaItems.length) {
      return replyWarn(client, interaction, {
        system: 'economy',
        title: 'Colección vacía',
        lines: [
          `${Emojis.dot} Tu colección está vacía.`,
          `${Emojis.dot} Empieza con ${Format.inlineCode('/pull')}.`
        ],
        signature: 'Primera tirada'
      }, { ephemeral: true })
    }

    const counts = new Map()
    for (const name of gachaItems) counts.set(name, (counts.get(name) || 0) + 1)

    const rows = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([name, count]) => `${Emojis.dot} ${Format.bold(name)} ${Format.inlineCode('x' + count)}`)

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.inventory} Colección`,
      description: [
        headerLine(Emojis.inventory, interaction.user.username),
        `${Emojis.dot} Objetos: ${Format.inlineCode(gachaItems.length)}`,
        Format.softDivider(20),
        rows.join('\n')
      ].join('\n'),
      signature: 'Colección viva'
    }, { ephemeral: true })
  }
}

