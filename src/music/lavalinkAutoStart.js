const fs = require('node:fs')
const path = require('node:path')
const net = require('node:net')
const { spawn, execSync } = require('node:child_process')
const https = require('node:https')
const { exec } = require('node:child_process')

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

/**
 * Descarga un archivo desde una URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject)
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

/**
 * Instala Java 17 automáticamente
 */
async function installJava() {
  const isWindows = process.platform === 'win32'
  const javaDir = path.resolve('bin', 'java-runtime')
  ensureDir(javaDir)

  const javaBin = path.join(javaDir, 'bin', isWindows ? 'java.exe' : 'java')
  if (fileExists(javaBin)) return javaBin

  console.log('[Java] No se encontró Java 17. Iniciando descarga automática...'.cyan)
  
  const arch = process.arch === 'x64' ? 'x64' : 'aarch64'
  const os = isWindows ? 'windows' : 'linux'
  const ext = isWindows ? 'zip' : 'tar.gz'
  const url = `https://api.adoptium.net/v3/binary/latest/17/ga/${os}/${arch}/jdk/hotspot/normal/eclipse?project=jdk`
  
  const tempFile = path.join(javaDir, `java-temp.${ext}`)
  
  try {
    await downloadFile(url, tempFile)
    console.log('[Java] Descarga completada. Extrayendo...'.cyan)

    if (isWindows) {
      // Usar PowerShell para extraer zip en Windows
      execSync(`powershell -Command "Expand-Archive -Path '${tempFile}' -DestinationPath '${javaDir}' -Force"`)
    } else {
      // Usar tar para extraer en Linux
      execSync(`tar -xzf "${tempFile}" -C "${javaDir}" --strip-components=1`)
      execSync(`chmod +x "${javaBin}"`)
    }

    // Limpiar archivo temporal
    fs.unlinkSync(tempFile)

    // En Windows, Adoptium extrae en una subcarpeta, necesitamos encontrar el bin
    if (isWindows) {
      const dirs = fs.readdirSync(javaDir).filter(f => fs.statSync(path.join(javaDir, f)).isDirectory())
      const subDir = dirs.find(d => d.startsWith('jdk'))
      if (subDir) {
        const actualBin = path.join(javaDir, subDir, 'bin', 'java.exe')
        return actualBin
      }
    }

    return javaBin
  } catch (e) {
    console.error('[Java] Error instalando Java:'.red, e.message)
    return null
  }
}

function findJavaBinary() {
  const isWindows = process.platform === 'win32'
  const javaExe = isWindows ? 'java.exe' : 'java'
  
  const candidates = [
    process.env.JAVA_BIN,
    process.env.JAVA_HOME && path.join(process.env.JAVA_HOME, 'bin', javaExe),
    path.resolve('bin', 'java-runtime', 'bin', javaExe), // Local install
    'java',
    !isWindows && '/usr/bin/java',
    !isWindows && '/usr/lib/jvm/default-java/bin/java'
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      execSync(`"${candidate}" -version`, { 
        stdio: 'ignore', 
        timeout: 2000,
        windowsHide: true 
      })
      return candidate
    } catch (e) {
      continue
    }
  }

  return null
}

async function autoStartLavalink (client, options = {}) {
  const enabled = parseBool(process.env.LAVALINK_AUTOSTART || process.env.AUTO_START_LAVALINK)
  if (!enabled) return { ok: true, started: false, reason: 'disabled' }

  const jarPath = path.resolve(options.jarPath || process.env.LAVALINK_JAR || 'Lavalink.jar')
  const configPath = path.resolve(options.configPath || process.env.LAVALINK_CONFIG || 'application.yml')
  
  let javaBin = options.javaBin || findJavaBinary()
  
  if (!javaBin) {
    javaBin = await installJava()
  }

  if (!javaBin) {
    return {
      ok: false,
      started: false,
      reason: 'missing_java',
      error: 'No se pudo encontrar ni instalar Java 17 automáticamente.'
    }
  }

  const { env, host, port } = buildLavalinkEnv(process.env)
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

  const maxWaitMs = Math.max(1000, Number(process.env.LAVALINK_STARTUP_TIMEOUT_MS || 10_000))
  const startedAt = Date.now()
  while (Date.now() - startedAt < maxWaitMs) {
    if (spawnError) {
      if (client && client.lavalinkProcess === child) client.lavalinkProcess = null
      return {
        ok: false,
        started: false,
        reason: 'spawn_failed',
        javaBin,
        error: spawnError.message
      }
    }
    if (await canConnect({ host, port, timeoutMs: 400 })) {
      return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid }
    }
    await wait(250)
  }

  return { ok: true, started: true, host, port, jarPath, configPath, pid: child.pid, warning: 'timeout_waiting_port' }
}

module.exports = {
  autoStartLavalink
}
