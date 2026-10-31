const { reloadSession } = require('./auth')
const publicStats = stats => Object.fromEntries(['guilds', 'users', 'activePlayers', 'updatedAt'].map(key => [key, stats[key]]))

async function streamStatistics(req, res, readStats, { intervalMs = 5000 } = {}) {
  const expected = { id: req.session.user.id, version: req.session.authVersion }
  let stopped = false, timer
  const stop = () => { stopped = true; clearTimeout(timer); if (!res.writableEnded) res.end() }
  res.on('close', stop)
  req.on('aborted', stop)
  async function send() {
    try {
      await reloadSession(req)
      if (stopped) return
      const user = req.session.user
      if (user.id !== expected.id || req.session.authVersion !== expected.version || user.expires_at <= Date.now()) throw Object.assign(new Error('not_authenticated'), { code: 'not_authenticated' })
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'private, no-store')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders()
      }
      if (res.writableLength > 65536) return stop()
      res.write(`data: ${JSON.stringify(readStats())}\n\n`)
      timer = setTimeout(send, intervalMs)
      timer.unref?.()
    } catch (error) {
      if (stopped) return
      if (!res.headersSent) res.status(error.code === 'not_authenticated' ? 401 : 503).json({ error: error.code === 'not_authenticated' ? 'not_authenticated' : 'statistics_unavailable' })
      stop()
    }
  }
  await send()
}
module.exports = { publicStats, streamStatistics }
