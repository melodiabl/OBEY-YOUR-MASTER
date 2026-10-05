const { test } = require('node:test')
const assert = require('node:assert/strict')
const { decorateProposal, decorationCatalog } = require('../handlers/architect/decoration')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { createArchitectService } = require('../handlers/architect/service')
function fixture() {
  const channel = (id, type, parentId = null) => ({ id, name: id, type, parentId, position: 1, topic: '', nsfw: false, bitrate: type === 2 ? 64000 : null, userLimit: type === 2 ? 0 : null, rateLimitPerUser: 0, overwrites: [] })
  const role = (id, managed = false) => ({ id, name: id, position: 1, permissions: '1024', color: 0, hoist: false, mentionable: false, managed })
  const source = { guildId: 'g', revision: 'r', channels: [channel('category', 4), channel('chat', 0, 'category'), channel('voice', 2, 'category'), channel('other', 0), channel('forum', 15, 'category')],
    roles: [role('g'), role('bot', true), role('staff')], roleColors: { staff: { primaryColor: 0, secondaryColor: null, tertiaryColor: null } } }
  const draft = { schemaVersion: 1, baseRevision: 'r', channels: structuredClone(source.channels), roles: structuredClone(source.roles), protectedIds: [] }
  return { source, draft }
}
const choices = extra => ({ theme: 'obey', decoration: 'expressive', scope: 'server', ...extra })
test('all seven themes produce only reviewed names/colors and preserve structure, permissions and IDs', () => {
  for (const theme of decorationCatalog().themes) {
    const { source, draft } = fixture(), before = structuredClone(draft)
    const result = decorateProposal(draft, source, choices({ theme: theme.id }))
    assert.deepEqual(draft, before)
    const blueprint = validateBlueprint(result.blueprint, source), diff = diffBlueprint(source, blueprint)
    assert.ok(diff.changes.length > 0)
    assert.ok(diff.changes.every(change => change.operation === 'update' && ['name', 'color'].includes(change.field)))
    assert.ok(compileEdits(diff).every(operation => !operation.action))
    for (const kind of ['channels', 'roles']) for (const item of before[kind]) {
      const actual = result.blueprint[kind].find(resource => resource.id === item.id)
      for (const field of Object.keys(item).filter(field => !['name', 'color'].includes(field))) assert.deepEqual(actual[field], item[field])
    }
    assert.deepEqual(decorateProposal(result.blueprint, source, choices({ theme: theme.id })).blueprint, result.blueprint)
  }
})
test('resource/category/roles scopes affect exactly their eligible targets and protection is reported', () => {
  const { source, draft } = fixture(); draft.protectedIds = ['chat']
  const category = decorateProposal(draft, source, choices({ scope: 'category', resourceId: 'category' }))
  assert.equal(category.decoration.changed, 2)
  assert.ok(category.decoration.skipped.some(item => item.id === 'chat'))
  assert.ok(category.decoration.skipped.some(item => item.id === 'forum'))
  assert.equal(category.blueprint.channels.find(item => item.id === 'other').name, 'other')
  assert.deepEqual(category.blueprint.roles, draft.roles)
  const role = decorateProposal(draft, source, choices({ scope: 'resource', kind: 'roles', resourceId: 'staff' }))
  assert.equal(role.decoration.changed, 1); assert.deepEqual(role.blueprint.channels, draft.channels)
  const roles = decorateProposal(draft, source, choices({ scope: 'roles' }))
  assert.equal(roles.decoration.changed, 1); assert.equal(roles.decoration.skipped.length, 2)
  draft.protectedIds = ['category']
  const zone = decorateProposal(draft, source, choices({ scope: 'category', resourceId: 'category' }))
  assert.equal(zone.decoration.changed, 0); assert.deepEqual(zone.blueprint, draft)
})
test('gradient, holographic and unknown role styles stay intact and unsupported requests fail', () => {
  for (const colors of [undefined, { primaryColor: 0, secondaryColor: 1, tertiaryColor: null }, { primaryColor: 0, secondaryColor: 1, tertiaryColor: 2 }]) {
    const { source, draft } = fixture(); source.roleColors.staff = colors
    const result = decorateProposal(draft, source, choices({ scope: 'roles' }))
    assert.deepEqual(result.blueprint.roles, draft.roles)
    assert.ok(result.decoration.skipped.some(item => item.id === 'staff' && item.reason === 'role_style'))
  }
  const { source, draft } = fixture()
  for (const options of [choices({ theme: 'unknown' }), choices({ scope: 'unknown' }), choices({ decoration: 'unknown' }), choices({ scope: 'resource', kind: 'channels', resourceId: 'foreign' }), choices({ scope: 'category', resourceId: 'chat' }), choices({ permissions: '8' })]) {
    assert.throws(() => decorateProposal(draft, source, options), error => error.code === 'invalid_decoration')
  }
})
test('changing theme replaces known preset decoration, preserves custom prefixes and rejects oversized names', () => {
  const { source, draft } = fixture()
  draft.channels.find(item => item.id === 'chat').name = '🔒・chat'
  const first = decorateProposal(draft, source, choices()).blueprint
  const second = decorateProposal(first, source, choices({ theme: 'sakura' })).blueprint
  assert.equal(second.channels.find(item => item.id === 'chat').name, '🌸・🔒・chat')
  const minimal = decorateProposal(second, source, choices({ theme: 'minimal', decoration: 'none' })).blueprint
  assert.equal(minimal.channels.find(item => item.id === 'chat').name, '🔒・chat')
  draft.channels.find(item => item.id === 'chat').name = 'a'.repeat(100)
  assert.throws(() => decorateProposal(draft, source, choices()), error => error.code === 'decoration_name_limit')
})
test('decoration service validates fresh revision and returns an editable preview without saving or applying', async () => {
  const { source, draft } = fixture(); let reads = 0
  const service = createArchitectService({ snapshot: async () => { reads++; return source } })
  const result = await service.decorate({ id: 'g' }, 'actor', draft, choices())
  assert.equal(reads, 1); assert.ok(result.diff.changes.length); assert.ok(result.decoration.changed)
  await assert.rejects(service.decorate({ id: 'g' }, 'actor', { ...draft, baseRevision: 'old' }, choices()), error => error.code === 'revision_conflict')
})
