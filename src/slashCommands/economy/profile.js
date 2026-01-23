const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Muestra tu perfil económico'),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const inv = Array.isArray(userData.inventory) ? userData.inventory : []

    return replyEmbed(client, interaction, {
      system: 'economy',
      kind: 'info',
      title: `${Emojis.economy} Perfil`,
      description: [
        headerLine(Emojis.economy, interaction.user.tag),
        `${Emojis.dot} ${Emojis.money} **Efectivo:** ${Format.inlineCode(money(userData.money || 0))}`,
        `${Emojis.dot} ${Emojis.bank} **Banco:** ${Format.inlineCode(money(userData.bank || 0))}`,
        `${Emojis.dot} ${Emojis.inventory} **Inventario:** ${Format.inlineCode(inv.length)}`,
        `${Emojis.dot} ${Emojis.human} **Pareja:** ${userData.partner ? `<@${userData.partner}>` : Format.italic('Ninguna')}`
      ].join('\n'),
      thumbnail: interaction.user.displayAvatarURL({ size: 256 }),
      signature: 'Progreso real'
    }, { ephemeral: true })
  }
}

