const { createHash, randomUUID } = require('node:crypto')
const { inspectCardImage } = require('./card-media')
const { cardPool } = require('./card-pool')
const SLOTS = ['welcome', 'welcomeDm', 'leave', 'leaveDm']
const MAX_ASSETS = 3, RETENTION_MS = 7 * 86400000
const ACTIVE_LEASE_MS = 30 * 86400000
class AssetError extends Error { constructor(code) { super(code); this.code = code } }
const fail = code => { throw new AssetError(code) }
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_:-]{1,100}$/.test(value)
const assetId = value => typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value)
const revision = (guildId, doc) => createHash('sha256').update(`${guildId}:${doc?.generation || 'none'}:${doc?.revision || 0}`).digest('hex')
const asBuffer = value => Buffer.isBuffer(value) ? Buffer.from(value) : value?._bsontype === 'Binary' ? Buffer.from(value.value(true)) : null

function createCardAssets(model, { normalize = buffer => cardPool().render('background', { backgroundBuffer: buffer }), now = () => new Date() } = {}) {
  const live = asset => !asset.expiresAt || new Date(asset.expiresAt) > now()
  const view = (guildId, doc) => ({ revision: revision(guildId, doc), limit: MAX_ASSETS,
    assets: (doc?.assets || []).filter(live).map(({ id, name, hash, width, height, bytes, createdAt, expiresAt }) => ({ id, name, hash, width, height, bytes, createdAt, expiresAt })),
    selections: Object.fromEntries(SLOTS.map(slot => [slot, Object.hasOwn(doc?.slots || {}, slot) ? doc.slots[slot] : 'legacy'])),
  })
  async function read(guildId, blobs = false) {
    if (!validId(guildId)) fail('invalid_asset_request')
    try {
      let query = model.findOne({ guildId })
      if (!blobs) query = query.select({ 'assets.blob': 0 })
      return await query.lean()
    } catch { fail('asset_storage') }
  }
  function expect(guildId, doc, expected) {
    if (typeof expected !== 'string' || !/^[0-9a-f]{64}$/.test(expected)) fail('invalid_asset_request')
    if (revision(guildId, doc) !== expected) fail('asset_conflict')
  }
  async function write(guildId, old, assets, slots) {
    const used = new Set(Object.values(slots).filter(value => assetId(value)))
    const time = now()
    assets = assets.map(asset => ({ ...asset, blob: asBuffer(asset.blob),
      expiresAt: used.has(asset.id) ? null : asset.expiresAt || new Date(+time + RETENTION_MS),
    }))
    const persistent = Object.values(slots).some(value => value !== 'legacy')
    const expiresAt = persistent ? new Date(+time + ACTIVE_LEASE_MS) : new Date(Math.max(+time + RETENTION_MS, ...assets.map(asset => +new Date(asset.expiresAt))))
    const filter = old ? { guildId, generation: old.generation, revision: old.revision } : { guildId, generation: { $exists: false } }
    try {
      const saved = await model.findOneAndUpdate(filter, { $set: { guildId, generation: old?.generation || randomUUID(),
        revision: (old?.revision || 0) + 1, assets, slots, expiresAt } }, { new: true, upsert: !old, setDefaultsOnInsert: false }).lean()
      if (!saved) fail('asset_conflict')
      return view(guildId, saved)
    } catch (error) { if (error instanceof AssetError) throw error; fail(error.code === 11000 ? 'asset_conflict' : 'asset_storage') }
  }
  return {
    list: async guildId => view(guildId, await read(guildId)),
    async upload(guildId, actorId, name, source, expected, beforeCommit = async () => {}) {
      if (!validId(actorId) || typeof name !== 'string' || name.length > 100) fail('invalid_asset_request')
      const old = await read(guildId, true); expect(guildId, old, expected)
      const assets = (old?.assets || []).filter(live)
      let buffer, dimensions
      try { inspectCardImage(source); buffer = await normalize(source); dimensions = inspectCardImage(buffer); if (dimensions.type !== 'image/png') fail('invalid_card_image') }
      catch (error) { fail(['card_queue_full', 'card_queue_timeout', 'card_worker_timeout', 'card_worker_memory', 'card_worker_unavailable', 'card_prepare_timeout', 'card_pool_closed'].includes(error?.code) ? 'asset_busy' : 'invalid_card_image') }
      const hash = createHash('sha256').update(buffer).digest('hex')
      await beforeCommit()
      if (assets.some(asset => asset.hash === hash)) { const latest = await read(guildId); expect(guildId, latest, expected); return view(guildId, latest) }
      if (assets.length >= MAX_ASSETS) fail('asset_limit')
      assets.push({ id: randomUUID(), name: name.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 80) || 'Fondo',
        hash, width: dimensions.width, height: dimensions.height, bytes: buffer.length, blob: buffer,
        createdBy: actorId, createdAt: now(), expiresAt: new Date(+now() + RETENTION_MS) })
      return write(guildId, old, assets, old?.slots || {})
    },
    async image(guildId, id) {
      if (!validId(guildId) || !assetId(id)) fail('invalid_asset_request')
      try {
        const doc = await model.findOne({ guildId, 'assets.id': id }).select({ assets: { $elemMatch: { id } } }).lean()
        const asset = doc?.assets?.find(value => value.id === id && live(value))
        if (!asset) fail('asset_not_found')
        const buffer = asBuffer(asset.blob)
        if (!buffer || createHash('sha256').update(buffer).digest('hex') !== asset.hash) fail('asset_storage')
        return buffer
      } catch (error) { if (error instanceof AssetError) throw error; fail('asset_storage') }
    },
    async background(guildId, slot) {
      if (!SLOTS.includes(slot)) fail('invalid_asset_request')
      const doc = await read(guildId)
      const id = Object.hasOwn(doc?.slots || {}, slot) ? doc.slots[slot] : 'legacy'
      if (id === 'legacy') return { managed: false, buffer: null }
      return { managed: true, buffer: id === null ? null : await this.image(guildId, id) }
    },
    async choose(guildId, slot, id, expected) {
      if (!SLOTS.includes(slot) || id !== null && id !== 'legacy' && !assetId(id)) fail('invalid_asset_request')
      const old = await read(guildId, true); expect(guildId, old, expected)
      const assets = (old?.assets || []).filter(live)
      if (assetId(id) && !assets.some(asset => asset.id === id)) fail('asset_not_found')
      return write(guildId, old, assets, { ...(old?.slots || {}), [slot]: id })
    },
    async remove(guildId, id, expected) {
      if (!assetId(id)) fail('invalid_asset_request')
      const old = await read(guildId, true); expect(guildId, old, expected)
      if (!(old?.assets || []).some(asset => asset.id === id)) fail('asset_not_found')
      if (Object.values(old.slots || {}).includes(id)) fail('asset_in_use')
      return write(guildId, old, old.assets.filter(asset => asset.id !== id && live(asset)), old.slots || {})
    },
    cleanup: async () => model.updateMany({ 'assets.expiresAt': { $lte: now() } }, { $pull: { assets: { expiresAt: { $lte: now(), $ne: null } } }, $inc: { revision: 1 } }),
    maintain: async guildIds => model.updateMany({ guildId: { $in: guildIds.filter(validId) },
      $or: SLOTS.map(slot => ({ [`slots.${slot}`]: { $exists: true, $ne: 'legacy' } })),
      expiresAt: { $lt: new Date(+now() + ACTIVE_LEASE_MS - 86400000) },
    }, { $set: { expiresAt: new Date(+now() + ACTIVE_LEASE_MS) } }),
    purgeGuild: async guildId => { if (!validId(guildId)) fail('invalid_asset_request'); await model.deleteOne({ guildId }) },
  }
}
const services = new WeakMap()
function bindCardAssets(settings, service) { services.set(settings, service) }
const cardAssetsFor = settings => services.get(settings)
module.exports = { createCardAssets, bindCardAssets, cardAssetsFor, SLOTS, MAX_ASSETS, RETENTION_MS, ACTIVE_LEASE_MS, AssetError }
