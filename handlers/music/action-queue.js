const { AsyncLocalStorage } = require('node:async_hooks')
function createActionQueue() {
  const context = new AsyncLocalStorage()
  const pending = new Map()
  function run(guildId, operation) {
    if (context.getStore() === guildId) return operation()
    const task = (pending.get(guildId) || Promise.resolve()).catch(() => {}).then(() => context.run(guildId, operation))
    pending.set(guildId, task)
    task.finally(() => { if (pending.get(guildId) === task) pending.delete(guildId) }).catch(() => {})
    return task
  }
  return { run, drain: guildId => Promise.allSettled(guildId ? [pending.get(guildId)].filter(Boolean) : [...pending.values()]) }
}
module.exports = { createActionQueue }
