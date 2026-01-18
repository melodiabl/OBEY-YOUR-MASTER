function ensureMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

async function replySafe (interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.followUp(payload)
    return await interaction.reply(payload)
  } catch (_) {}
}

async function replyError (interaction, message) {
  return replySafe(interaction, { content: `❌ ${message}`, ephemeral: true })
}

module.exports = {
  ensureMap,
  replySafe,
  replyError
}
