const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Muestra tu inventario'),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const items = Array.isArray(userData.inventory) ? userData.inventory : []
    const shown = items.slice(0, 25)
    const lines = shown.length
      ? shown.map((it, i) => `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${Format.inlineCode(String(it))}`)
      : [`${Emojis.dot} ${Format.italic('Vacío')}`]

    return replyEmbed(client, interaction, {
      system: 'inventory',
      kind: 'info',
      title: `${Emojis.inventory} Inventario`,
      description: [
        headerLine(Emojis.inventory, interaction.user.username),
        `${Emojis.dot} Items: ${Format.inlineCode(items.length)}`,
        Format.softDivider(20),
        lines.join('\n'),
        items.length > 25 ? Format.subtext(`Y ${items.length - 25} más…`) : null
      ].filter(Boolean).join('\n'),
      signature: 'Colección viva'
    }, { ephemeral: true })
  }
}

