const { AsyncLocalStorage } = require('node:async_hooks')
function createActionQueue() {
  const context = new AsyncLocalStorage()
  const pending = new Map()
  function enqueue(guildId, operation) {
    const task = (pending.get(guildId) || Promise.resolve()).catch(() => {}).then(() => context.run(guildId, operation))
    pending.set(guildId, task)
    task.finally(() => { if (pending.get(guildId) === task) pending.delete(guildId) }).catch(() => {})
    return task
  }
  function run(guildId, operation) {
    if (context.getStore() === guildId) return operation()
    return enqueue(guildId, operation)
  }
  return { run, enqueue, drain: guildId => Promise.allSettled(guildId ? [pending.get(guildId)].filter(Boolean) : [...pending.values()]) }
}
module.exports = { createActionQueue }
