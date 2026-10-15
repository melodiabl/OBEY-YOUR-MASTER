const test = require('node:test')
const assert = require('node:assert/strict')
const { validateSelectedAssets, syncEmojis, planEmojiSync } = require('../handlers/assets/emoji-pipeline')
const { createRegistry, assetHash, emojiName } = require('../handlers/assets/registry')
const applicationId = '423456789012345678'
function adapterFixture() {
  const existing = [], uploads = []
  return { existing, uploads, adapter: {
    list: async () => existing,
    create: async (name, buffer, asset) => {
      const result = { id: String(223456789012345678n + BigInt(uploads.length)), name, animated: asset.animated }
      uploads.push({ buffer, asset }); existing.push(result); return result
    },
  } }
}

test('the selected plan validates exactly 295 PNG/GIF emojis with canonical names', async () => {
  const assets = await validateSelectedAssets()
  assert.equal(assets.length, 295)
  assert.equal(assets.filter(asset => asset.animated).length, 10)
  assert.ok(assets.every(asset => asset.width === 128 && asset.height === 128 && asset.bytes <= 256 * 1024 && asset.name.length <= 32))
  assert.ok(assets.filter(asset => asset.animated).every(asset => asset.mimeType === 'image/gif'))
  assert.equal((await validateSelectedAssets(['repeat', 'icon.loop'])).length, 1)
  await assert.rejects(validateSelectedAssets(['badge.supporter']), /emoji/i)
  const [longName] = await validateSelectedAssets(['motion.carta-especial'])
  assert.match(longName.name, /^obey_motion_carta_espec_/)
})

test('canonical sync preserves GIF type, deduplicates aliases and resumes without reupload', async () => {
  const assets = await validateSelectedAssets(['play', 'icon.play', 'motion.cargando'])
  const f = adapterFixture(), saved = []
  const result = await syncEmojis({ assets, applicationId, adapter: f.adapter, save: async map => saved.push(structuredClone(map)) })
  assert.equal(result.version, 2)
  assert.equal(f.uploads.length, 2)
  assert.equal(result.emojis['motion.cargando'].animated, true)
  const resolver = createRegistry(result, applicationId)
  assert.equal(resolver.emoji('play').id, result.emojis['icon.play'].id)
  assert.match(resolver.markup('motion.cargando'), /^<a:/)
  await syncEmojis({ assets, applicationId, adapter: f.adapter, previous: result, save: async () => {} })
  assert.equal(f.uploads.length, 2)
  assert.equal(saved.length, 2)
})

test('migration carries verified v1 resources until their canonical replacements exist', async () => {
  const hash = assetHash('pause')
  const legacy = { id: '623456789012345678', name: emojiName('pause', hash), animated: false, sha256: hash }
  const previous = { version: 1, applicationId, emojis: { pause: legacy } }
  const f = adapterFixture(); f.existing.push(legacy)
  const assets = await validateSelectedAssets(['icon.play'])
  const result = await syncEmojis({ assets, applicationId, previous, adapter: f.adapter, save: async () => {} })
  assert.deepEqual(result.legacyEmojis.pause, legacy)
  assert.equal(createRegistry(result, applicationId).emoji('pause').id, legacy.id)
  const foreign = await syncEmojis({ assets, applicationId: '523456789012345678', previous, adapter: f.adapter, save: async () => {} })
  assert.deepEqual(foreign.legacyEmojis, {})
})

test('a failed individual upload is recorded while later resources and checkpoints survive', async () => {
  const assets = await validateSelectedAssets(['icon.play', 'icon.pause'])
  const f = adapterFixture(), saved = []
  const create = f.adapter.create
  f.adapter.create = async (...args) => { if (args[0] === assets[0].name) throw new Error('private token must not persist'); return create(...args) }
  const result = await syncEmojis({ assets, applicationId, adapter: f.adapter, save: async map => saved.push(structuredClone(map)) })
  assert.equal(result.emojis['icon.play'], undefined)
  assert.ok(result.emojis['icon.pause'].id)
  assert.deepEqual(result.failures, { 'icon.play': 'upload_failed' })
  assert.equal(saved.length, 2)
  assert.ok(!JSON.stringify(result).includes('private token'))
})

test('remote deletion removes old IDs and lost GIF responses reconcile without repeated POST', async () => {
  const assets = await validateSelectedAssets(['motion.cargando'])
  const f = adapterFixture()
  const create = f.adapter.create
  f.adapter.create = async (...args) => { await create(...args); throw new Error('lost_response') }
  const previous = { version: 2, applicationId, emojis: { 'icon.pause': { id: '623456789012345678', name: 'deleted', animated: false, sha256: '0'.repeat(64) } } }
  const result = await syncEmojis({ assets, applicationId, previous, adapter: f.adapter, save: async () => {} })
  assert.equal(result.emojis['icon.pause'], undefined)
  assert.equal(result.emojis['motion.cargando'].animated, true)
  assert.equal(f.uploads.length, 1)
})

test('a known ID renamed or replaced remotely is a collision rather than a duplicate upload', async () => {
  const assets = await validateSelectedAssets(['icon.play'])
  const previous = { version: 2, applicationId, emojis: { 'icon.play': { id: '623456789012345678', name: assets[0].name, animated: false, sha256: assets[0].sha256 } } }
  assert.throws(() => planEmojiSync(assets, [{ id: '623456789012345678', name: 'changed_name', animated: false }], previous), /collision/i)
})
