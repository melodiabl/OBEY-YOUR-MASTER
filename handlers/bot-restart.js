function createBotRestart(client, shutdown, { enabled = process.env.OBEY_OWNER_RESTART_ENABLED === 'true', schedule = setImmediate } = {}) {
  let reservation = null, requested = false
  const eligible = () => enabled && !requested && !client._shuttingDown
  const available = () => eligible() && reservation === null
  return { available, prepare() {
    if (!available()) return null
    const token = {}; reservation = token
    return {
      cancel() { if (reservation === token) reservation = null },
      commit() {
        if (reservation !== token || !eligible()) return false
        reservation = null; requested = true
        try { schedule(() => Promise.resolve().then(shutdown).catch(() => console.warn('[Lifecycle] restart_shutdown_failed'))) }
        catch { requested = false; return false }
        return true
      },
    }
  } }
}
module.exports = { createBotRestart }
