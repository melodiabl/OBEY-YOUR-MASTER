function createRecoveryPolicy({ now = Date.now, maxAttempts = 5 } = {}) {
  const entries = new Map()
  const entry = id => {
    if (!entries.has(id)) entries.set(id, { generation: 0, attempts: 0, nextAt: 0, cancelled: false })
    return entries.get(id)
  }
  return {
    generation: id => entry(id).generation,
    eligible(id) { const value = entry(id); return !value.cancelled && value.attempts < maxAttempts && now() >= value.nextAt },
    delay(id) { const value = entry(id); return value.cancelled || value.attempts >= maxAttempts ? null : Math.max(0, value.nextAt - now()) },
    failed(id) {
      const value = entry(id)
      value.attempts++
      const exhausted = value.attempts >= maxAttempts
      const delayMs = Math.min(60000, 5000 * 2 ** (value.attempts - 1))
      value.nextAt = now() + delayMs
      return { attempts: value.attempts, exhausted, delayMs }
    },
    succeeded(id) { Object.assign(entry(id), { attempts: 0, nextAt: 0 }) },
    retry(id) { const value = entry(id); Object.assign(value, { generation: value.generation + 1, attempts: 0, nextAt: 0, cancelled: false }) },
    cancel(id) { const value = entry(id); value.generation++; value.cancelled = true },
  }
}
module.exports = { createRecoveryPolicy }
