const fs = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const { spawn } = require('node:child_process')

function parseBool (v) {
  const s = String(v || '').trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}

function normalizeConnectHost (host) {
  const h = String(host || '').trim()
  if (!h) return '127.0.0.1'
  if (h === '0.0.0.0') return '127.0.0.1'
  return h
}

function ensureDir (dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
  } catch (e) {}
}

function fileExists (filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (e) {
    return false
  }
}

function wait (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function canConnect ({ host, port, timeoutMs = 600 }) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let done = false

    const finish = (ok) => {
      if (done) return
      done = true
      try {
        socket.destroy()
      } catch (e) {}
      resolve(ok)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))

    try {
      socket.connect(port, host)
    } catch (e) {
      finish(false)
    }
  })
}

function buildLavalinkEnv (baseEnv) {
  const env = { ...baseEnv }

  const host = normalizeConnectHost(env.LAVALINK_CONNECT_HOST || env.LAVALINK_HOST || '127.0.0.1')
  const port = String(env.LAVALINK_PORT || '2333')
  const password = String(env.LAVALINK_PASSWORD || 'youshallnotpass')

  // Spring Boot env overrides
  env.SERVER_ADDRESS = String(env.LAVALINK_BIND || env.SERVER_ADDRESS || '0.0.0.0')
  env.SERVER_PORT = String(env.SERVER_PORT || port)
  env.LAVALINK_SERVER_PASSWORD = String(env.LAVALINK_SERVER_PASSWORD || password)

  // Lavasrc Spotify (opcional)
  const spotifyClientId = env.LAVALINK_SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENTID
  const spotifyClientSecret = env.LAVALINK_SPOTIFY_CLIENT_SECRET || env.SPOTIFY_CLIENT_SECRET || env.SPOTIFY_CLIENTSECRET

  if (spotifyClientId) env.LAVALINK_SERVER_LAVASRC_SPOTIFY_CLIENTID = String(spotifyClientId)
  if (spotifyClientSecret) env.LAVALINK_SERVER_LAVASRC_SPOTIFY_CLIENTSECRET = String(spotifyClientSecret)

  return { env, host, port: Number(port), password }
}

async function autoStartLavalink (client, options = {}) {
  const enabled = parseBool(process.env.LAVALINK_AUTOSTART || process.env.AUTO_START_LAVALINK)
  if (!enabled) return { ok: true, started: false, reason: 'disabled' }

  const jarPath = path.resolve(options.jarPath || process.env.LAVALINK_JAR || 'Lavalink.jar')
  const configPath = path.resolve(options.configPath || process.env.LAVALINK_CONFIG || 'application.yml')
  const javaBin = String(options.javaBin || process.env.JAVA_BIN || 'java')

  const { env, host, port } = buildLavalinkEnv(process.env)

  // Evita duplicados: si ya responde el puerto, no lo iniciamos.
  const already = await canConnect({ host, port })
  if (already) return { ok: true, started: false, reason: 'already_running', host, port }

  if (!fileExists(jarPath)) {
    return { ok: false, started: false, reason: 'missing_jar', jarPath }
  }

  const args = ['-jar', jarPath]
  if (fileExists(configPath)) {
    args.push(`--spring.config.location=file:${configPath}`)
  }

  ensureDir(path.resolve('logs'))
  const outPath = path.resolve('logs', 'lavalink.out.log')
  const errPath = path.resolve('logs', 'lavalink.err.log')

  let spawnError = null
  const child = spawn(javaBin, args, {
    cwd: process.cwd(),
    env,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  // Importante: si no existe `java` (ENOENT), Node emite `error` en el child.
  // Sin listener, eso termina en uncaughtException.
  child.once('error', (err) => { spawnError = err })

  try {
    const out = fs.createWriteStream(outPath, { flags: 'a' })
    const err = fs.createWriteStream(errPath, { flags: 'a' })
    if (child.stdout) child.stdout.pipe(out)
    if (child.stderr) child.stderr.pipe(err)
  } catch (e) {}

  if (client) client.lavalinkProcess = child

  const restart = parseBool(process.env.LAVALINK_AUTORESTART)
  if (restart) {
    child.once('exit', async () => {
      try {
        await wait(1500)
        await autoStartLavalink(client, options)
      } catch (e) {}
    })
  }

  // Espera breve a que levante
  const maxWaitMs = Math.max(1000, Number(process.env.LAVALINK_STARTUP_TIMEOUT_MS || 10_000))
  const startedAt = Date.now()
  while (Date.now() - startedAt < maxWaitMs) {
    if (spawnError) {
      const code = spawnError.code || spawnError.errno
      const isMissingJava = String(code).toUpperCase() === 'ENOENT'
      if (client && client.lavalinkProcess === child) client.lavalinkProcess = null
      return {
        ok: false,
        started: false,
        reason: isMissingJava ? 'missing_java' : 'spawn_failed',
        javaBin,
        code,
        error: spawnError.message
      }
    }
    if (await canConnect({ host, port, timeoutMs: 400 })) {
      return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid }
    }
    await wait(250)
  }

  if (spawnError) {
    const code = spawnError.code || spawnError.errno
    const isMissingJava = String(code).toUpperCase() === 'ENOENT'
    if (client && client.lavalinkProcess === child) client.lavalinkProcess = null
    return {
      ok: false,
      started: false,
      reason: isMissingJava ? 'missing_java' : 'spawn_failed',
      javaBin,
      code,
      error: spawnError.message
    }
  }

  return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid, warning: 'timeout_waiting_port' }
}

module.exports = {
  autoStartLavalink
}
