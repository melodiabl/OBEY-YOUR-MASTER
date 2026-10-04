const test = require('node:test')
const assert = require('node:assert/strict')
const { buildControls } = require('../handlers/music/embeds')
const setup = require('../handlers/music/setup')
const registry = require('../handlers/assets/registry')
const { validateAssets, planEmojiSync, syncEmojis } = require('../handlers/assets/emoji-pipeline')
const state = { history: [], loop: 'none', volume: 100, paused: false }
const ids = ['mp_shuffle', 'mp_prev', 'mp_toggle', 'mp_skip', 'mp_loop', 'mp_lyrics', 'mp_voldown', 'mp_stop', 'mp_volup', 'mp_queue', 'mp_like', 'mp_autoplay']
function buttons(rows) { return rows.flatMap(row => row.toJSON().components) }

test('active controls preserve all twelve IDs and use labelled Unicode fallbacks', () => {
  const result = buttons(buildControls(state))
  assert.deepEqual(result.map(button => button.custom_id), ids)
  assert.ok(result.every(button => button.label && button.emoji.name && !button.emoji.id))
  assert.equal(result.find(button => button.custom_id === 'mp_prev').disabled, true)
  assert.equal(result.find(button => button.custom_id === 'mp_stop').style, 4)
})

test('controls retain pause, loop, autoplay, history and volume states', () => {
  const result = new Map(buttons(buildControls({ ...state, history: [{}], paused: true, loop: 'queue', autoplay: true, shuffle: true, volume: 200 })).map(button => [button.custom_id, button]))
  assert.equal(result.get('mp_prev').disabled, false)
  assert.equal(result.get('mp_toggle').label, 'Reanudar')
  assert.equal(result.get('mp_toggle').style, 3)
  assert.equal(result.get('mp_loop').label, 'Repetir cola')
  assert.equal(result.get('mp_loop').style, 1)
  assert.equal(result.get('mp_autoplay').style, 3)
  assert.equal(result.get('mp_volup').disabled, true)
  assert.equal(buttons(buildControls({ ...state, volume: 0 })).find(button => button.custom_id === 'mp_voldown').disabled, true)
})

test('idle setup exposes the same twelve controls with every action disabled', () => {
  const panel = setup.idlePanel({ user: { displayAvatarURL: () => 'https://example.com/avatar.png' } })
  const result = buttons(panel.components)
  assert.deepEqual(result.map(button => button.custom_id), ids)
  assert.ok(result.every(button => button.disabled && button.label))
})

test('approved emoji files are valid and dry-run plans no external writes', async () => {
  const assets = await validateAssets()
  assert.equal(assets.length, 89)
  assert.ok(assets.every(asset => asset.width === 128 && asset.height === 128 && asset.bytes <= 256 * 1024))
  const plan = planEmojiSync(assets.slice(0, 2), [])
  assert.equal(plan.length, 2)
  assert.ok(plan.every(item => item.action === 'create' && /^obey_\w+$/.test(item.name)))
  assert.throws(() => registry.assetPath('../.env'), /Unknown asset/)
})

test('sync reuses hash-named assets and preserves unrelated application emojis', async () => {
  const assets = (await validateAssets()).slice(0, 2)
  const wanted = planEmojiSync(assets, [])
  const unrelated = { id: '123456789012345678', name: 'someone_else' }
  const existing = { id: '223456789012345678', name: wanted[0].name, animated: false }
  const created = []
  const adapter = { list: async () => [unrelated, existing, ...created], create: async (name, buffer) => { assert.ok(Buffer.isBuffer(buffer)); const emoji = { id: '323456789012345678', name, animated: false }; created.push(emoji); return emoji } }
  const saved = []
  const result = await syncEmojis({ assets, applicationId: '423456789012345678', adapter, save: async map => saved.push(structuredClone(map)) })
  assert.equal(created.length, 1)
  assert.equal(Object.keys(result.emojis).length, 2)
  assert.equal(result.emojis[assets[0].key].id, existing.id)
  await syncEmojis({ assets, applicationId: result.applicationId, adapter, save: async () => {} })
  assert.equal(created.length, 1)
  const resolver = registry.createRegistry(result, result.applicationId)
  assert.equal(resolver.emoji(assets[0].key).id, existing.id)
  assert.equal(registry.createRegistry(result, '523456789012345678').emoji(assets[0].key).id, undefined)
  assert.equal(registry.createRegistry({ ...result, emojis: { [assets[0].key]: { id: 'made-up' } } }, result.applicationId).emoji(assets[0].key).id, undefined)
  assert.equal(saved.length, 2)
})

test('a lost create response is reconciled by listing before another upload', async () => {
  const assets = (await validateAssets()).slice(0, 1)
  const stored = []
  let attempts = 0
  const result = await syncEmojis({ assets, applicationId: '423456789012345678', save: async () => {}, adapter: {
    list: async () => stored,
    create: async name => { attempts++; stored.push({ id: '623456789012345678', name, animated: false }); throw new Error('response_lost') },
  } })
  assert.equal(attempts, 1)
  assert.equal(result.emojis[assets[0].key].id, stored[0].id)
})

test('malformed maps degrade to Unicode and stale content hashes never become custom IDs', () => {
  assert.equal(registry.createRegistry(null, '423456789012345678').emoji('play').id, undefined)
  assert.equal(registry.createRegistry({ version: 1, applicationId: '423456789012345678', emojis: { play: { id: '223456789012345678', name: 'obey_play_00000000', sha256: '0'.repeat(64), animated: false } } }, '423456789012345678').emoji('play').id, undefined)
})

test('ambiguous remote emoji names fail instead of uploading or overwriting', async () => {
  const assets = await validateAssets(['play'])
  let uploads = 0
  const name = assets[0].name
  await assert.rejects(syncEmojis({ assets, applicationId: '423456789012345678', save: async () => {}, adapter: {
    list: async () => [{ id: '223456789012345678', name, animated: false }, { id: '323456789012345678', name, animated: false }],
    create: async () => { uploads++ },
  } }), /Ambiguous/)
  assert.equal(uploads, 0)
})
