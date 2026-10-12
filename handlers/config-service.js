// Compatibility precedence is explicit. Reading never migrates or overwrites data.
function welcomeMessage(settings, guildId) {
  const config = settings.get(guildId) || {}
  return config.welcome?.msg ?? config.welcome?.message ?? config.welcomeMessage ?? ''
}

async function saveWelcomeMessage(settings, guildId, message) {
  return require('./welcome-configuration').welcomeConfiguration(settings).save(guildId,{message})
}
async function saveWelcomeChannel(settings,guildId,channelId){return require('./welcome-configuration').welcomeConfiguration(settings).save(guildId,{channelId:channelId==='nochannel'?null:channelId})}

module.exports = { welcomeMessage, saveWelcomeMessage, saveWelcomeChannel }
