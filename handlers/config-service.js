// Compatibility precedence is explicit. Reading never migrates or overwrites data.
function welcomeMessage(settings, guildId) {
  const config = settings.get(guildId) || {}
  return config.welcome?.msg ?? config.welcome?.message ?? config.welcomeMessage ?? ''
}

async function saveWelcomeMessage(settings, guildId, message) {
  if (typeof message !== 'string' || message.length > 500) throw new Error('El mensaje no puede superar 500 caracteres.')
  settings.set(guildId, message, 'welcome.msg')
  settings.set(guildId, message, 'welcome.message')
  settings.set(guildId, message, 'welcomeMessage')
  // No confirmation until the legacy store has persisted all three compatible keys.
  await settings.flush()
}

module.exports = { welcomeMessage, saveWelcomeMessage }
