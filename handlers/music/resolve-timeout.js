// Bounds local waiting; late provider results are ignored, not treated as cancelled remote requests.
async function lookupWithTimeout(lookup, timeoutMs = 8000, signal) {
  if (signal?.aborted) throw new Error('Music lookup cancelled')
  let timer, onAbort
  try {
    const waits = [
      Promise.resolve().then(lookup),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Music lookup timed out')), timeoutMs) }),
    ]
    if (signal) waits.push(new Promise((_, reject) => {
      onAbort = () => reject(new Error('Music lookup cancelled'))
      signal.addEventListener('abort', onAbort, { once: true })
      if (signal.aborted) onAbort()
    }))
    return await Promise.race(waits)
  } finally {
    clearTimeout(timer)
    if (onAbort) signal.removeEventListener('abort', onAbort)
  }
}
async function resolveWithTimeout(node, query, timeoutMs = 8000, signal) {
  if (!node?.rest?.resolve) throw new Error('Music node unavailable')
  return lookupWithTimeout(() => node.rest.resolve(query), timeoutMs, signal)
}
module.exports = { resolveWithTimeout, lookupWithTimeout }
