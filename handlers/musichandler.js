module.exports = client => {
  require('./music/index')(client)
  client.modules ||= require('./feature-registry').createModuleRegistry()
  client.modules.register(require('./music/manifest')(client), client.music)
}
