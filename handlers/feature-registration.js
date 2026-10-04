const guildEvents = new Set(['messageCreate', 'messageUpdate', 'messageDelete', 'messageReactionAdd', 'messageReactionRemove', 'guildMemberAdd', 'guildMemberRemove', 'guildMemberUpdate', 'guildCreate', 'guildDelete', 'voiceStateUpdate', 'interactionCreate', 'channelDelete', 'channelCreate'])

function registerFeature(client, name, initialize) {
  const on = client.on, once = client.once
  const wrap = (event, listener) => function (...args) {
    if (guildEvents.has(event) && (!client._dbReady || client._shuttingDown)) return
    try {
      Promise.resolve(listener.apply(this, args)).catch(error => console.error(`[Feature:${name}] ${event}:`, error.message))
    } catch (error) { console.error(`[Feature:${name}] ${event}:`, error.message) }
  }
  client.on = function (event, listener) {
    return on.call(this, event === 'ready' ? 'dbReady' : event, wrap(event, listener))
  }
  client.once = function (event, listener) {
    return once.call(this, event === 'ready' ? 'dbReady' : event, wrap(event, listener))
  }
  try { return initialize(client) }
  finally { client.on = on; client.once = once }
}
module.exports = { registerFeature }
