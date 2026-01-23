const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, warnEmbed } = require('../ui/uiKit')

function notImplemented (featureName) {
  const shown = String(featureName || 'Función').trim() || 'Función'
  return async (client, interaction) => {
    const ui = await getGuildUiConfig(client, interaction.guild.id)
    const e = warnEmbed({
      ui,
      system: 'info',
      title: 'En desarrollo',
      lines: [
        `${Emojis.dot} ${Format.bold(shown)} todavía está en construcción.`,
        `${Emojis.dot} Si querés que lo priorice: contame el flujo exacto, permisos y edge-cases.`
      ]
    })
    return interaction.reply({ embeds: [e], ephemeral: true })
  }
}

module.exports = {
  notImplemented
}
