const http = require('http')
const https = require('https')

function getLib (url) {
  return String(url).startsWith('https:') ? https : http
}

function fetchBuffer (url, { timeoutMs = 15_000, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const lib = getLib(url)
    const req = lib.request(url, { method: 'GET', headers }, (res) => {
      const code = Number(res.statusCode || 0)
      if (code >= 400) {
        res.resume()
        return reject(new Error(`HTTP ${code}`))
      }
      const chunks = []
      res.on('data', (d) => chunks.push(d))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    })
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Timeout'))
    })
    req.end()
  })
}

async function fetchJson (url, opts) {
  const buf = await fetchBuffer(url, opts)
  try {
    return JSON.parse(buf.toString('utf8'))
  } catch (e) {
    throw new Error('JSON inválido')
  }
}

module.exports = {
  fetchBuffer,
  fetchJson
}
