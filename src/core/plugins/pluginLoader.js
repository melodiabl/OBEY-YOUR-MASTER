const fs = require('node:fs')
const path = require('node:path')

function isJsFile (file) {
  return file.toLowerCase().endsWith('.js')
}

function safeRequire (p) {
  // eslint-disable-next-line import/no-dynamic-require
  return require(p)
}

function toPluginName (filePath) {
  return path.basename(filePath).replace(/\.js$/i, '')
}

function normalizePlugin (mod, filePath) {
  const plugin = mod && typeof mod === 'object' ? mod : {}
  const name = String(plugin.name || toPluginName(filePath)).trim()
  const version = plugin.version ? String(plugin.version) : null
  const description = plugin.description ? String(plugin.description) : null
  const init = typeof plugin.init === 'function' ? plugin.init : null

  return { name, version, description, init }
}

function clearRequireCache (filePath) {
  try {
    const resolved = require.resolve(filePath)
    delete require.cache[resolved]
  } catch (e) {}
}

async function loadPlugins (client, { dir } = {}) {
  const pluginsDir = dir || path.join(process.cwd(), 'plugins', 'bot')
  const res = {
    dir: pluginsDir,
    loaded: 0,
    failed: 0,
    plugins: []
  }

  let entries = []
  try {
    entries = fs.readdirSync(pluginsDir, { withFileTypes: true })
  } catch (e) {
    return res
  }

  for (const ent of entries) {
    if (!ent.isFile()) continue
    if (!isJsFile(ent.name)) continue
    const filePath = path.join(pluginsDir, ent.name)

    const record = {
      name: toPluginName(filePath),
      file: filePath,
      ok: false,
      error: null,
      version: null,
      description: null
    }

    try {
      const mod = safeRequire(filePath)
      const plugin = normalizePlugin(mod, filePath)
      record.name = plugin.name
      record.version = plugin.version
      record.description = plugin.description

      if (!plugin.init) throw new Error('Plugin inválido: falta export init(client)')

      await plugin.init(client)
      record.ok = true
      res.loaded++
    } catch (e) {
      record.ok = false
      record.error = e?.message || String(e || 'Error desconocido')
      res.failed++
    }

    res.plugins.push(record)
  }

  return res
}

async function reloadPlugins (client, { dir } = {}) {
  const pluginsDir = dir || path.join(process.cwd(), 'plugins', 'bot')
  let entries = []
  try {
    entries = fs.readdirSync(pluginsDir, { withFileTypes: true })
  } catch (e) {
    return loadPlugins(client, { dir: pluginsDir })
  }

  for (const ent of entries) {
    if (!ent.isFile()) continue
    if (!isJsFile(ent.name)) continue
    clearRequireCache(path.join(pluginsDir, ent.name))
  }

  return loadPlugins(client, { dir: pluginsDir })
}

module.exports = {
  loadPlugins,
  reloadPlugins
}
