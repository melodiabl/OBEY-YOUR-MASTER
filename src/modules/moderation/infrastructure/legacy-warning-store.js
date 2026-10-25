const { HistoryError } = require('../domain/warnings')
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Joins the old SyncMap write queue and confirms a conditional Mongo update.
// A concurrent legacy write changes the snapshot and makes this operation fail.
async function removeReferences(client, targetId, select, revalidate, context) {
  const store = client.userProfiles
  await store.exclusive(async () => {
    context.check()
    const cached = structuredClone(store.get(targetId, 'warnings'))
    const doc = await store.model.findOne({ [store.guildKey]: targetId }).lean()
    context.check()
    if (!doc || !Array.isArray(doc.warnings) || !equal(cached, doc.warnings)) throw new HistoryError('changed')
    const sourceIds = select(doc.warnings)
    if (!sourceIds.length) throw new HistoryError('invalidPage')
    const records = sourceIds.map(id => [id, client.modActions.get(id)])
    await revalidate()
    if (!equal(cached, store.get(targetId, 'warnings'))
      || records.some(([id, record]) => client.modActions.get(id) !== record)) throw new HistoryError('changed')
    context.check()
    const ids = new Set(sourceIds.map(String))
    const remaining = doc.warnings.filter(id => !ids.has(String(id)))
    const result = await store.model.updateOne(
      { _id: doc._id, [store.guildKey]: targetId, warnings: { $eq: doc.warnings } },
      { $set: { warnings: remaining } },
    )
    if (!result?.acknowledged) throw new HistoryError('unavailable')
    if (result.matchedCount !== 1) throw new HistoryError('changed')
    if (equal(cached, store.get(targetId, 'warnings'))) store.patchCached(targetId, { warnings: remaining })
    for (const [id, record] of records) if (client.modActions.get(id) === record) client.modActions.delete(id)
  })
}

module.exports = { removeReferences }
