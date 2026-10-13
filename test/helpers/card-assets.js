const v8 = require('node:v8')
const copy = value => v8.deserialize(v8.serialize(value))
function cardAssetsFixture() {
  const records = new Map()
  function match(doc, filter) {
    if (!doc) return false
    return Object.entries(filter).every(([key, value]) => {
      if (key === 'assets.id') return doc.assets.some(asset => asset.id === value)
      if (key === 'assets.expiresAt') return doc.assets.some(asset => asset.expiresAt && asset.expiresAt <= value.$lte)
      if (value && typeof value === 'object' && '$exists' in value) return Object.hasOwn(doc, key) === value.$exists
      return doc[key] === value
    })
  }
  function query(read) {
    let projection
    return { select(value) { projection = value; return this }, async lean() {
      const value = read(); if (!value) return null
      const doc = copy(value)
      if (projection?.['assets.blob'] === 0) doc.assets.forEach(asset => delete asset.blob)
      if (projection?.assets?.$elemMatch) doc.assets = doc.assets.filter(asset => asset.id === projection.assets.$elemMatch.id)
      return doc
    } }
  }
  const model = {
    findOne: filter => query(() => { const doc = records.get(filter.guildId); return match(doc, filter) ? doc : null }),
    findOneAndUpdate: (filter, update, options) => query(() => {
      const old = records.get(filter.guildId)
      if (old && !match(old, filter)) { if (options.upsert) throw Object.assign(Error('duplicate'), { code: 11000 }); return null }
      if (!old && !options.upsert) return null
      const doc = { ...(old || {}), ...copy(update.$set), guildId: filter.guildId }
      records.set(filter.guildId, doc); return doc
    }),
    async updateMany(filter, update) {
      for (const [id, doc] of records) if (match(doc, filter)) {
        doc.assets = doc.assets.filter(asset => !asset.expiresAt || asset.expiresAt > update.$pull.assets.expiresAt.$lte)
        doc.revision += update.$inc.revision
        records.set(id, doc)
      }
    },
    async deleteOne(filter) { records.delete(filter.guildId) },
  }
  return { model, records }
}
module.exports = { cardAssetsFixture }
