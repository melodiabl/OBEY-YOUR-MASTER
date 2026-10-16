// Operator-only measurements. Importing this file never opens a connection.
const { performance } = require('node:perf_hooks')
const { randomBytes } = require('node:crypto')
const { allowedMusicTrack } = require('./nodes-config')
const QUERIES = ['ytsearch:Daft Punk One More Time', 'spsearch:Daft Punk One More Time', 'ytsearch:Coldplay Viva La Vida']
const samples = rows => (rows || []).filter(value => Number.isFinite(value) && value >= 0).sort((a, b) => a - b)
function median(rows) {
  const values = samples(rows), n = values.length
  return n ? Math.round((n % 2 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2) * 10) / 10 : null
}
function summarize(node, socket, searches, stats = {}) {
  const rtt = samples(socket.rttMs), successes = searches.filter(row => row.tracks > 0)
  const load = stats.cpu?.lavalinkLoad
  return { id: node.id, label: node.label || node.id, websocketReady: socket.ready === true,
    rttSamples: rtt.length, medianRttMs: median(rtt), jitterMs: rtt.length ? Math.round((rtt.at(-1) - rtt[0]) * 10) / 10 : null,
    successfulSearches: successes.length, totalSearches: searches.length, medianSearchMs: median(successes.map(row => row.ms)),
    searches, players: Number.isInteger(stats.players) && stats.players >= 0 ? stats.players : null,
    lavalinkCpuPercent: Number.isFinite(load) && load >= 0 ? Math.round(load * 10000) / 100 : null,
    usable: socket.ready === true && rtt.length > 0 && searches.length === QUERIES.length && successes.length === searches.length }
}
function rank(rows) {
  return [...rows].sort((a, b) => Number(b.usable) - Number(a.usable) ||
    (a.medianRttMs ?? Infinity) - (b.medianRttMs ?? Infinity) || (a.medianSearchMs ?? Infinity) - (b.medianSearchMs ?? Infinity))
}
async function requestNode(node, path) {
  const started = performance.now()
  const response = await fetch('https://' + node.url + '/v4' + path, {
    headers: { Authorization: node.auth }, signal: AbortSignal.timeout(9000), redirect: 'error',
  })
  if (!response.ok) throw new Error('node_request_failed')
  const data = await response.json()
  return { data, ms: Math.round(performance.now() - started) }
}
function measureSocket(node) {
  const WebSocket = require('ws')
  // A separate synthetic client ID keeps diagnostic sessions apart from the bot.
  const id = (((BigInt(Date.now()) - 1420070400000n) << 22n) + BigInt(randomBytes(3).readUIntBE(0, 3) % 4194304)).toString()
  return new Promise(resolve => {
    const ws = new WebSocket('wss://' + node.url + '/v4/websocket', {
      headers: { Authorization: node.auth, 'User-Id': id, 'Client-Name': 'OBEY-node-benchmark/1.0' }, handshakeTimeout: 8000,
    })
    let ready = false, finished = false, sent, nextPing
    const rttMs = [], deadline = setTimeout(finish, 12000)
    function finish() {
      if (finished) return
      finished = true; clearTimeout(deadline); clearTimeout(nextPing); ws.terminate(); resolve({ ready, rttMs })
    }
    function ping() { if (finished || ws.readyState !== WebSocket.OPEN) return; sent = performance.now(); ws.ping() }
    ws.on('error', finish); ws.on('unexpected-response', finish); ws.on('close', finish)
    ws.on('message', raw => {
      try { if (JSON.parse(raw).op === 'ready' && !ready) { ready = true; ping() } } catch { /* Ignore non-JSON provider messages. */ }
    })
    ws.on('pong', () => {
      if (sent === undefined || finished) return
      rttMs.push(performance.now() - sent); sent = undefined
      if (rttMs.length === 5) finish()
      else nextPing = setTimeout(ping, 200)
    })
  })
}
async function benchmark(entries, { request = requestNode, socket = measureSocket } = {}) {
  const nodes = entries.filter(node => node.visibility === 'public' && node.enabled !== false)
  const results = []
  async function measure(node) {
    const connection = await socket(node).catch(() => ({ ready: false, rttMs: [] }))
    const stats = await request(node, '/stats').then(result => result.data).catch(() => ({})), searches = []
    for (const query of QUERIES) {
      try {
        const { data, ms } = await request(node, '/loadtracks?identifier=' + encodeURIComponent(query))
        const rows = data?.loadType === 'search' ? data.data : data?.loadType === 'track' ? [data.data] : []
        const tracks = Array.isArray(rows) ? rows.filter(track => typeof track?.encoded === 'string' && track.encoded && allowedMusicTrack(track)).length : 0
        searches.push({ query, ms, tracks })
      } catch { searches.push({ query, ms: null, tracks: 0, error: 'request_failed' }) }
    }
    return summarize(node, connection, searches, stats || {})
  }
  // Small bounded batches; this is a functional probe, never a load test.
  for (let i = 0; i < nodes.length; i += 2) results.push(...await Promise.all(nodes.slice(i, i + 2).map(measure)))
  return rank(results)
}
module.exports = { summarize, rank, benchmark }
