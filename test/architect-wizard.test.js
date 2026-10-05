const { test } = require('node:test')
const assert = require('node:assert/strict')
const { wizardCatalog, generateProposal } = require('../handlers/architect/wizard')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { createArchitectService } = require('../handlers/architect/service')
const source = () => ({ guildId: 'g', revision: 'r', roles: [], channels: [] })
const draft = () => ({ schemaVersion: 1, baseRevision: 'r', roles: [], channels: [], protectedIds: [] })
const choices = extra => ({ community: 'gaming', theme: 'minimal', size: 'small', language: 'es', decoration: 'none', spaces: [], ...extra })
test('every official community base generates a valid editable proposal supported by the actual apply compiler', () => {
  assert.equal(wizardCatalog().communities.length, 10)
  for (const community of wizardCatalog().communities) {
    const generated = generateProposal(draft(), choices({ community: community.id, title: 'Mi comunidad' }))
    const blueprint = validateBlueprint(generated.blueprint, source())
    const operations = compileEdits(diffBlueprint(source(), blueprint))
    assert.ok(operations.length > 3)
    assert.ok(operations.every(operation => operation.action === 'create'))
    assert.ok(blueprint.channels.filter(channel => channel.type === 4).every(category => blueprint.channels.some(child => child.parentId === category.id)))
    assert.ok(blueprint.channels.every(channel => channel.overwrites.length === 0))
  }
})
test('language, theme, decoration and size change the generated resources, with existing/protected resources preserved', () => {
  const minimal = generateProposal(draft(), choices()).blueprint
  const expressive = generateProposal(draft(), choices({ language: 'en', theme: 'sakura', decoration: 'expressive', size: 'large', spaces: ['welcome', 'music'] })).blueprint
  assert.ok(expressive.channels.length > minimal.channels.length)
  assert.ok(expressive.channels.some(channel => channel.name.includes('welcome')))
  assert.notEqual(expressive.roles[0].color, minimal.roles[0].color)
  const input = draft(); input.channels.push({ id: 'staff', name: 'Staff privado', type: 4, parentId: null, position: 12, overwrites: [{ id: 'g', type: 0, allow: '0', deny: '1024' }] }); input.protectedIds.push('staff')
  const original = structuredClone(input), generated = generateProposal(input, choices())
  assert.deepEqual(input, original)
  assert.deepEqual(generated.blueprint.channels.find(channel => channel.id === 'staff'), original.channels[0])
  assert.deepEqual(generated.blueprint.protectedIds, ['staff'])
  assert.deepEqual(generateProposal(generated.blueprint, choices()).blueprint, generated.blueprint)
})
test('wizard rejects unsupported choices and private/protected category collisions without replacing resources', () => {
  for (const options of [choices({ community: 'unknown' }), choices({ theme: 'unknown' }), choices({ spaces: ['tickets'] }), choices({ size: 'huge' }), choices({ extra: true }), choices({ community: 'custom', title: '' })]) {
    assert.throws(() => generateProposal(draft(), options), /wizard/i)
  }
  const input = generateProposal(draft(), choices()).blueprint
  const category = input.channels.find(channel => channel.type === 4)
  category.overwrites = [{ id: 'g', type: 0, allow: '0', deny: '1024' }]
  input.channels = input.channels.filter(channel => channel.parentId !== category.id)
  assert.throws(() => generateProposal(input, choices()), /category/i)
})
test('wizard service reads fresh structure, checks draft revision and returns the same preview without saving or applying', async () => {
  let reads = 0
  const service = createArchitectService({ snapshot: async () => { reads++; return source() } })
  const result = await service.generate({ id: 'g' }, 'actor', draft(), choices())
  assert.equal(reads, 1); assert.ok(result.diff.counts.create > 0)
  assert.equal(result.blueprint.baseRevision, 'r')
  assert.equal(result.wizard.configuresModules, false)
  await assert.rejects(service.generate({ id: 'g' }, 'actor', { ...draft(), baseRevision: 'old' }, choices()), error => error.code === 'revision_conflict')
})
