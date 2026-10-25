const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
class HistoryError extends Error { constructor(code) { super(code); this.code = code } }

// Legacy warning IDs are global and can be reused after restart. Never trust an ID
// without checking the record's subject, guild and action.
function visibleWarnings(ids, targetId, lookup) {
  if (ids == null) return []
  if (!Array.isArray(ids)) throw new TypeError('Invalid legacy warning references')
  const rows = []
  for (const id of ids) {
    if (typeof id !== 'string' && !Number.isSafeInteger(id)) continue
    const record = lookup(id)
    if (!record || record.user !== targetId || record.type !== 'warning' || !validId(record.guild)) continue
    rows.push({ ...record, sourceId: id })
  }
  return rows
}

function indexFor(value, zero = false) {
  if (value === undefined && !zero) return 1
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) throw new HistoryError('invalidPage')
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < (zero ? 0 : 1)) throw new HistoryError('invalidPage')
  return number
}
module.exports = { validId, visibleWarnings, indexFor, HistoryError }
