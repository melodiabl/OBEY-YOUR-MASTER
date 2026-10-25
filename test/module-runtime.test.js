'use strict'
const test = require('node:test')
const assert = require('node:assert/strict')
const { createModuleRuntime } = require('../src/core/module-runtime')

test('dependency ordering and reverse cleanup', async () => {
  const actions = [], runtime = createModuleRuntime()
  runtime.register({ id: 'ui', dependencies: ['db'], start: () => actions.push('ui+'), stop: () => actions.push('ui-') })
  runtime.register({ id: 'db', start: () => actions.push('db+'), stop: () => actions.push('db-') })
  await runtime.start({})
  assert.deepEqual(actions, ['db+', 'ui+'])
  assert.equal(runtime.status().ui, 'running')
  await runtime.stop({})
  assert.deepEqual(actions, ['db+', 'ui+', 'ui-', 'db-'])
})

test('cycles and missing dependencies fail before startup', () => {
  const runtime = createModuleRuntime()
  runtime.register({ id: 'a', dependencies: ['b'] })
  assert.throws(() => runtime.ordered(), /Unknown module dependency/)
  runtime.register({ id: 'b', dependencies: ['a'] })
  assert.throws(() => runtime.ordered(), /Circular module dependency/)
})

test('a failed module is cleaned up; preceding modules are rolled back', async () => {
  const actions = [], runtime = createModuleRuntime()
  runtime.register({ id: 'first', start: () => actions.push('first+'), stop: () => actions.push('first-') })
  runtime.register({ id: 'second', dependencies: ['first'], start() { throw Error('boom') }, stop: () => actions.push('second-') })
  await assert.rejects(runtime.start({}), /boom/)
  assert.deepEqual(actions, ['first+', 'second-', 'first-'])
  assert.equal(runtime.status().second, 'start_failed')
})

test('rejects invalid and duplicate module IDs', () => {
  const runtime = createModuleRuntime()
  assert.throws(() => runtime.register({ id: '../bad' }), /Invalid module id/)
  runtime.register({ id: 'music' })
  assert.throws(() => runtime.register({ id: 'music' }), /Duplicate module/)
})
