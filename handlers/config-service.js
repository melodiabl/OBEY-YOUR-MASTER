// Compatibility precedence is explicit. Reading never migrates or overwrites data.
function welcomeMessage(settings, guildId) {
  const config = settings.get(guildId) || {}
  return config.welcome?.msg ?? config.welcome?.message ?? config.welcomeMessage ?? ''
}

module.exports = { welcomeMessage }
