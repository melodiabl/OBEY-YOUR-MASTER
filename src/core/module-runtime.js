'use strict'
/** Opt-in lifecycle management: never auto-registers Discord events. */
function createModuleRuntime({ logger = console } = {}) {
  const modules = new Map()
  const states = new Map()
  const started = []
  let closed = false
  function register(definition) {
    if (!definition || !/^[a-z][a-z0-9-]*$/.test(definition.id)) throw new TypeError('Invalid module id')
    if (modules.has(definition.id)) throw new Error('Duplicate module: ' + definition.id)
    if (definition.start !== undefined && typeof definition.start !== 'function') throw new TypeError('start must be a function')
    if (definition.stop !== undefined && typeof definition.stop !== 'function') throw new TypeError('stop must be a function')
    const deps = definition.dependencies ?? []
    if (!Array.isArray(deps) || deps.some(id => typeof id !== 'string') || new Set(deps).size !== deps.length) throw new TypeError('Invalid dependencies')
    modules.set(definition.id, Object.freeze({ ...definition, dependencies: Object.freeze([...deps]) }))
    states.set(definition.id, 'registered')
  }
  function ordered() {
    const visited = new Set(), visiting = new Set(), sequence = []
    function visit(id) {
      if (visited.has(id)) return
      if (visiting.has(id)) throw new Error('Circular module dependency: ' + id)
      const module = modules.get(id)
      if (!module) throw new Error('Unknown module dependency: ' + id)
      visiting.add(id)
      for (const dep of module.dependencies) visit(dep)
      visiting.delete(id)
      visited.add(id)
      sequence.push(module)
    }
    for (const id of modules.keys()) visit(id)
    return sequence
  }
  async function stop(context) {
    closed = true
    const errors = []
    while (started.length) {
      const module = started.pop()
      try { await module.stop?.(context); states.set(module.id, 'stopped') }
      catch (error) {
        states.set(module.id, 'stop_failed')
        logger.error?.('[Module] stop failed', module.id, error)
        errors.push(error)
      }
    }
    if (errors.length) throw new AggregateError(errors, 'Module shutdown failed')
  }
  async function start(context) {
    if (closed) throw new Error('Module runtime already closed')
    if (started.length) throw new Error('Module runtime already started')
    const sequence = ordered()
    try {
      for (const module of sequence) {
        states.set(module.id, 'starting')
        try { await module.start?.(context) }
        catch (error) {
          states.set(module.id, 'start_failed')
          try { await module.stop?.(context) } catch (cleanupError) {
            logger.error?.('[Module] failed-start cleanup', module.id, cleanupError)
          }
          throw error
        }
        started.push(module)
        states.set(module.id, 'running')
      }
    } catch (error) {
      try { await stop(context) } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], 'Startup and rollback failed')
      }
      throw error
    }
  }
  return Object.freeze({ register, start, stop, ordered, list: () => [...modules.keys()], status: () => Object.fromEntries(states) })
}
module.exports = { createModuleRuntime }
