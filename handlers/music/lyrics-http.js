// Bound provider work independently of sockets: DNS/connect/read all share one deadline.
function requestJson(transport, options, { timeoutMs = 8000, maxBytes = 512 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    let request, settled = false, bytes = 0
    const chunks = []
    function finish(error, value) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(value)
    }
    function abort(error) { finish(error); request?.destroy(error) }
    const timer = setTimeout(() => abort(new Error('lyrics provider timeout')), timeoutMs)
    try {
      request = transport.get(options, response => {
        response.on('error', finish)
        response.on('aborted', () => finish(new Error('lyrics response aborted')))
        response.on('data', chunk => {
          if (settled) return
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          bytes += buffer.length
          if (bytes > maxBytes) { abort(new Error('lyrics response too large')); return }
          chunks.push(buffer)
        })
        response.on('end', () => {
          if (settled) return
          if (response.statusCode !== 200) return finish(new Error(`lyrics HTTP ${response.statusCode}`))
          try { finish(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
          catch { finish(new Error('invalid lyrics JSON')) }
        })
      })
      request.on('error', finish)
    } catch (error) { finish(error) }
  })
}
module.exports = { requestJson }
