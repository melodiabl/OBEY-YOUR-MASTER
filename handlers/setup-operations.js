const states = new WeakMap()
function stateFor(client) {
  if (!states.has(client)) states.set(client, { closing: false, pending: new Set(), drain: null })
  return states.get(client)
}
function runSetupOperation(client, execute) {
  const state = stateFor(client)
  if (client._shuttingDown || state.closing) return Promise.reject(Object.assign(new Error('setup_unavailable'), { code: 'setup_unavailable' }))
  const result = Promise.resolve().then(execute)
  state.pending.add(result)
  void result.then(() => state.pending.delete(result), () => state.pending.delete(result))
  return result
}
function stopSetupOperations(client) {
  const state = stateFor(client)
  state.closing = true
  return state.drain ||= Promise.allSettled([...state.pending]).then(() => undefined)
}
module.exports = { runSetupOperation, stopSetupOperations }
