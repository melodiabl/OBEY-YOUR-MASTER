const { getGuildUiConfig, errorEmbed } = require('../core/ui/uiKit')

function ensureMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

async function replySafe (interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.editReply(payload)
    return await interaction.reply(payload)
  } catch (_) {}

  try {
    return await interaction.followUp(payload)
  } catch (_) {}
}

async function replyError (interaction, message, { system = 'utility', title, hint, ephemeral = true } = {}) {
  const client = interaction.client
  const ui = await getGuildUiConfig(client, interaction.guild?.id)
  const e = errorEmbed({
    ui,
    system,
    title,
    reason: String(message || 'Ocurrió un error.'),
    hint
  })
  return replySafe(interaction, { embeds: [e], ephemeral: Boolean(ephemeral) })
}

module.exports = {
  ensureMap,
  replySafe,
  replyError
}
