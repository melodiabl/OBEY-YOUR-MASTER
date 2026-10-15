const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const { createHash } = require('node:crypto')
const assets = require('../handlers/assets/registry')
const { buildControls } = require('../handlers/music/controls')
const applicationId = '423456789012345678', emojiId = '223456789012345678'
function candidate(key, overrides = {}) {
  const file = assets.selectedAsset(key)
  return { id: emojiId, name: file.name, animated: file.animated, sha256: file.sha256, ...overrides }
}
function map(key, overrides) {
  return { version: 2, applicationId, emojis: { [key]: candidate(key, overrides) } }
}

test('selected catalog and aliases resolve files with verified imported content', () => {
  assert.equal(Object.keys(assets.contract.selected.assets).length, 316)
  assert.equal(Object.keys(assets.contract.selected.aliases).length, 89)
  for (const [alias, canonical] of Object.entries(assets.contract.selected.aliases)) {
    assert.deepEqual(assets.selectedAsset(alias), assets.selectedAsset(canonical))
  }
  const file = assets.selectedAsset('icon.play')
  assert.equal(createHash('sha256').update(fs.readFileSync(file.path)).digest('hex'), file.sha256)
  assert.throws(() => assets.selectedAsset('../.env'), /Unknown asset/)
  assert.throws(() => assets.selectedAsset('badge.supporter'), /destination/i)
  assert.equal(assets.selectedAsset('badge.supporter', 'rendererVariant').variant, 'png128')
})

test('v2 aliases share one canonical emoji while Soundy retains all control IDs', () => {
  const resolver = assets.createRegistry(map('icon.play'), applicationId)
  assert.deepEqual(resolver.emoji('play'), resolver.emoji('icon.play'))
  assert.equal(resolver.emoji('play').id, emojiId)
  const rows = buildControls({ paused: true, history: [], volume: 100 }, { assets: resolver })
  const controls = rows.flatMap(row => row.toJSON().components)
  assert.deepEqual(controls.map(control => control.custom_id), assets.contract.musicControls.map(control => control.customId))
  assert.equal(controls.find(control => control.custom_id === 'mp_toggle').emoji.id, emojiId)
})

test('animated emojis use a: markup and preserve their static reduced motion file', () => {
  const resolver = assets.createRegistry(map('motion.cargando'), applicationId)
  assert.equal(resolver.emoji('motion.cargando').animated, true)
  assert.match(resolver.markup('motion.cargando'), /^<a:obey_motion_cargando_/)
  assert.equal(assets.selectedAsset('motion.cargando', 'reducedMotionVariant').mimeType, 'image/png')
})

test('foreign applications, invalid hashes, names and animation types fall back safely', () => {
  for (const override of [{ sha256: '0'.repeat(64) }, { name: 'unverified' }, { animated: true }, { available: false }]) {
    assert.equal(assets.createRegistry(map('icon.play', override), applicationId).emoji('play').id, undefined)
  }
  assert.equal(assets.createRegistry(map('icon.play'), '523456789012345678').emoji('play').id, undefined)
  assert.equal(assets.createRegistry(null, applicationId).markup('icon.play'), '▶️')
})

test('remote reconciliation removes deleted or unavailable emojis and permits verified recovery', () => {
  const resolver = assets.createRegistry(map('icon.play'), applicationId)
  resolver.reconcile([])
  assert.equal(resolver.markup('play'), '▶️')
  resolver.reconcile([candidate('icon.play', { available: false })])
  assert.equal(resolver.emoji('play').id, undefined)
  resolver.reconcile([candidate('icon.play')])
  assert.equal(resolver.emoji('play').id, emojiId)
  assert.throws(() => resolver.reconcile(null), /Invalid/)
})

test('v1 maps remain readable and never validate old hashes as selected content', () => {
  const hash = assets.assetHash('play')
  const legacy = { id: emojiId, name: assets.emojiName('play', hash), animated: false, sha256: hash }
  const previous = { version: 1, applicationId, emojis: { play: legacy } }
  assert.equal(assets.createRegistry(previous, applicationId).emoji('play').id, emojiId)
  assert.equal(assets.createRegistry({ version: 2, applicationId, legacyEmojis: previous.emojis, emojis: {} }, applicationId).emoji('play').id, emojiId)
  assert.equal(assets.createRegistry(map('icon.play', legacy), applicationId).emoji('play').id, undefined)
})

test('a missing or corrupted selected file produces fallback without crashing controls', t => {
  const file = assets.contract.selected.assets['icon.play'].files.oscuro_png
  const original = file.path
  t.after(() => { file.path = original })
  file.path = 'selected/missing-file.png'
  assert.equal(assets.createRegistry(map('icon.play'), applicationId).emoji('play').id, undefined)
  file.path = assets.contract.selected.assets['icon.pause'].files.oscuro_png.path
  assert.equal(assets.createRegistry(map('icon.play'), applicationId).emoji('play').id, undefined)
})

test('Soundy message emoji properties follow the current resolver rather than a startup snapshot', t => {
  const config = require('../handlers/music/config')
  const original = assets.registry.musicEmoji
  t.after(() => { assets.registry.musicEmoji = original })
  assets.registry.musicEmoji = key => `current-${key}`
  assert.equal(config.emoji.play, 'current-play')
  assert.equal(config.config.emoji.play, 'current-play')
  assets.registry.musicEmoji = key => `fallback-${key}`
  assert.equal(config.emoji.play, 'fallback-play')
})
