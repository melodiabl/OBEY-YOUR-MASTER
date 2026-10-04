module.exports = client => {
  require('./music/index')(client)
  client.modules ||= require('./module-registry').createModuleRegistry()
  client.modules.register(require('./music/manifest')(client), client.music)
}
