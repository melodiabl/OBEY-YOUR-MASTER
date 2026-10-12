const { Events } = require('discord.js')
const { registry: defaultRegistry, configuredApplicationId } = require('./registry')
const initialized = new WeakMap()

function registerAssetLifecycle(client, { registry = defaultRegistry, applicationId = configuredApplicationId } = {}) {
  if (initialized.has(client)) return initialized.get(client)
  let pending, timer, stopped = false
  // Persisted IDs require a fresh list from this application before being used.
  registry.reconcile([])
  function refresh() {
    if (stopped || client._shuttingDown) return Promise.resolve()
    if (pending) return pending
    pending = (async () => {
      try {
        if (!applicationId || client.application?.id !== applicationId) throw new Error('application_mismatch')
        const emojis = await client.application.emojis.fetch()
        if (!stopped && !client._shuttingDown) registry.reconcile([...emojis.values()].map(({ id, name, animated, available }) => ({ id, name, animated, available })))
      } catch {
        if (!stopped && !client._shuttingDown) {
          registry.reconcile([])
          console.warn('[Assets] Application emoji verification unavailable; using Unicode fallbacks')
        }
      }
    })().finally(() => { pending = null })
    return pending
  }
  function ready() {
    refresh()
    timer = setInterval(refresh, 5 * 60 * 1000)
    timer.unref()
  }
  function stop() {
    stopped = true
    clearInterval(timer)
    client.removeListener(Events.ClientReady, ready)
  }
  const lifecycle = { registry, refresh, stop }
  initialized.set(client, lifecycle)
  client.assets = lifecycle
  client.stopAssets = stop
  client.once(Events.ClientReady, ready)
  return lifecycle
}
module.exports = { registerAssetLifecycle }
