const { createLogService } = require('./logs/service')
const { attachLogEvents } = require('./logs/events')
const initialized = new WeakMap()

module.exports = client => {
  if (initialized.has(client)) return initialized.get(client)
  const service = createLogService(client), detach = attachLogEvents(client, service)
  initialized.set(client, service)
  client.logs = service
  client.stopLogs = async () => { detach(); await service.stop() }
  return service
}
