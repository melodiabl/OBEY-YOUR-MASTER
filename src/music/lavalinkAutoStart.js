const fs = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const { spawn, execSync } = require('node:child_process')
const https = require('node:https')

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

  env.SERVER_PORT = port
  env.SERVER_ADDRESS = env.LAVALINK_BIND || '0.0.0.0'
  env.LAVALINK_SERVER_PASSWORD = password

  const spotifyClientId = env.LAVALINK_SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENTID
  const spotifyClientSecret = env.LAVALINK_SPOTIFY_CLIENT_SECRET || env.SPOTIFY_CLIENT_SECRET || env.SPOTIFY_CLIENTSECRET

  if (spotifyClientId) env.LAVALINK_SERVER_LAVASRC_SPOTIFY_CLIENTID = String(spotifyClientId)
  if (spotifyClientSecret) env.LAVALINK_SERVER_LAVASRC_SPOTIFY_CLIENTSECRET = String(spotifyClientSecret)

  return { env, host, port: Number(port), password }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Status Code: ${res.statusCode}`))
      }

      const file = fs.createWriteStream(dest)
      res.pipe(file)

      file.on('finish', () => {
        file.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      file.on('error', (err) => {
        fs.unlink(dest, () => {})
        reject(err)
      })

      res.on('error', (err) => {
        file.destroy()
        fs.unlink(dest, () => {})
        reject(err)
      })
    }).on('error', reject)
  })
}

async function installJava() {
  const isWindows = process.platform === 'win32'
  const javaDir = path.resolve('bin', 'java-runtime')
  ensureDir(javaDir)

  const javaBin = path.join(javaDir, 'bin', isWindows ? 'java.exe' : 'java')
  if (fileExists(javaBin)) return javaBin

  console.log('[DEBUG-Java] No se encontró Java local. Iniciando instalación...'.gray)
  
  const arch = process.arch === 'x64' ? 'x64' : 'aarch64'
  const os = isWindows ? 'windows' : 'linux'
  const ext = isWindows ? 'zip' : 'tar.gz'
  const url = `https://api.adoptium.net/v3/binary/latest/17/ga/${os}/${arch}/jdk/hotspot/normal/eclipse?project=jdk`
  
  const tempFile = path.join(javaDir, `java-temp.${ext}`)
  
  try {
    console.log(`[DEBUG-Java] Descargando JDK desde: ${url}`.gray)
    await downloadFile(url, tempFile)
    
    const stats = fs.statSync(tempFile)
    console.log(`[DEBUG-Java] Descarga finalizada (${(stats.size / 1024 / 1024).toFixed(2)} MB)`.gray)

    if (stats.size < 1000000) {
      throw new Error('Archivo corrupto (demasiado pequeño)')
    }

    console.log('[DEBUG-Java] Extrayendo archivos...'.gray)
    if (isWindows) {
      execSync(`powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${javaDir}' -Force"`)
    } else {
      execSync(`tar -xzf "${tempFile}" -C "${javaDir}" --strip-components=1`)
      if (fileExists(javaBin)) execSync(`chmod +x "${javaBin}"`)
    }

    if (fileExists(tempFile)) fs.unlinkSync(tempFile)
    console.log(`[DEBUG-Java] Instalación completada en: ${javaBin}`.gray)

    return fileExists(javaBin) ? javaBin : null
  } catch (e) {
    console.error('[DEBUG-Java] Error crítico en instalación:'.red, e.message)
    if (fileExists(tempFile)) fs.unlinkSync(tempFile)
    return null
  }
}

function findJavaBinary() {
  const isWindows = process.platform === 'win32'
  const javaExe = isWindows ? 'java.exe' : 'java'
  
  const candidates = [
    process.env.JAVA_BIN,
    process.env.JAVA_HOME && path.join(process.env.JAVA_HOME, 'bin', javaExe),
    path.resolve('bin', 'java-runtime', 'bin', javaExe),
    'java'
  ].filter(Boolean)

  console.log(`[DEBUG-Java] Buscando binario en ${candidates.length} ubicaciones...`.gray)

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" -version`, { 
        stdio: 'ignore', 
        timeout: 2000,
        windowsHide: true 
      })
      console.log(`[DEBUG-Java] Binario válido encontrado: ${candidate}`.gray)
      return candidate
    } catch (e) {
      continue
    }
  }

  return null
}

async function autoStartLavalink (client, options = {}) {
  console.log('[DEBUG-Lavalink] Iniciando proceso de auto-start...'.gray)
  const enabled = parseBool(process.env.LAVALINK_AUTOSTART || process.env.AUTO_START_LAVALINK)
  if (!enabled) {
    console.log('[DEBUG-Lavalink] Auto-start desactivado en configuración.'.gray)
    return { ok: true, started: false, reason: 'disabled' }
  }

  const jarPath = path.resolve(options.jarPath || process.env.LAVALINK_JAR || 'Lavalink.jar')
  const configPath = path.resolve(options.configPath || process.env.LAVALINK_CONFIG || 'application.yml')
  
  console.log(`[DEBUG-Lavalink] JAR: ${jarPath}`.gray)
  console.log(`[DEBUG-Lavalink] Config: ${configPath}`.gray)

  let javaBin = options.javaBin || findJavaBinary()
  
  if (!javaBin) {
    javaBin = await installJava()
  }

  if (!javaBin) {
    console.error('[DEBUG-Lavalink] Fallo fatal: No se encontró Java.'.red)
    return {
      ok: false,
      started: false,
      reason: 'missing_java',
      error: 'No se pudo encontrar ni instalar Java 17 automáticamente.'
    }
  }

  const { env, host, port, password } = buildLavalinkEnv(process.env)
  console.log(`[DEBUG-Lavalink] Intentando conexión previa a ${host}:${port}...`.gray)
  const already = await canConnect({ host, port })
  if (already) {
    console.log('[DEBUG-Lavalink] Lavalink ya está corriendo en este puerto. Saltando inicio.'.gray)
    return { ok: true, started: false, reason: 'already_running', host, port }
  }

  if (!fileExists(jarPath)) {
    console.error(`[DEBUG-Lavalink] Archivo no encontrado: ${jarPath}`.red)
    return { ok: false, started: false, reason: 'missing_jar', jarPath }
  }

  const args = [
    `-Dserver.port=${port}`,
    `-Dserver.address=${env.SERVER_ADDRESS}`,
    `-Dlavalink.server.password=${password}`,
    '-jar', jarPath
  ]
  
  if (fileExists(configPath)) {
    args.push(`--spring.config.location=file:${configPath}`)
  }

  console.log(`[DEBUG-Lavalink] Lanzando: ${javaBin} ${args.join(' ')}`.gray)

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

  child.once('error', (err) => { 
    spawnError = err
    console.error(`[DEBUG-Lavalink] Error de spawn: ${err.message}`.red)
  })

  try {
    const out = fs.createWriteStream(outPath, { flags: 'a' })
    const err = fs.createWriteStream(errPath, { flags: 'a' })
    if (child.stdout) child.stdout.pipe(out)
    if (child.stderr) child.stderr.pipe(err)
  } catch (e) {}

  if (client) client.lavalinkProcess = child

  const restart = parseBool(process.env.LAVALINK_AUTORESTART)
  if (restart) {
    child.once('exit', (code) => {
      console.log(`[DEBUG-Lavalink] Proceso cerrado con código ${code}. Reiniciando...`.yellow)
      setTimeout(() => autoStartLavalink(client, options), 2000)
    })
  }

  const maxWaitMs = Math.max(1000, Number(process.env.LAVALINK_STARTUP_TIMEOUT_MS || 40000))
  const startedAt = Date.now()
  console.log(`[DEBUG-Lavalink] Esperando hasta ${maxWaitMs / 1000}s para disponibilidad...`.gray)

  while (Date.now() - startedAt < maxWaitMs) {
    if (spawnError) {
      if (client && client.lavalinkProcess === child) client.lavalinkProcess = null
      return { ok: false, started: false, reason: 'spawn_failed', javaBin, error: spawnError.message }
    }
    if (await canConnect({ host, port, timeoutMs: 400 })) {
      console.log(`[DEBUG-Lavalink] Puerto ${port} abierto. Lavalink listo.`.green)
      return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid }
    }
    await wait(1000)
  }

  console.warn('[DEBUG-Lavalink] Tiempo de espera agotado, pero el proceso sigue vivo.'.yellow)
  return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid, warning: 'timeout_waiting_port' }
}

module.exports = {
  autoStartLavalink
}
