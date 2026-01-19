function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function splitForGlobalLimit (slashArray) {
  const all = Array.isArray(slashArray) ? slashArray.filter(Boolean) : []
  const GLOBAL_MAX = 100

  const global = all.slice(0, GLOBAL_MAX)
  const dropped = all.slice(GLOBAL_MAX)

  return { all, global, dropped }
}

function getDeprecatedCommandNames (client) {
  const names = new Set()
  try {
    const cmds = client?.slashCommands
    if (!cmds || typeof cmds.values !== 'function') return []
    for (const c of cmds.values()) {
      if (c?.REGISTER !== false) continue
      const name = c?.CMD?.name
      if (name) names.add(String(name))
    }
  } catch (e) {}
  return Array.from(names)
}

async function deleteCommandsByName (commandManager, names) {
  const wanted = new Set((Array.isArray(names) ? names : []).filter(Boolean).map(n => String(n)))
  if (!wanted.size) return { deleted: 0 }
  if (!commandManager?.fetch) return { deleted: 0 }

  const existing = await commandManager.fetch().catch(() => null)
  if (!existing) return { deleted: 0 }

  let deleted = 0
  for (const cmd of existing.values()) {
    if (!wanted.has(cmd?.name)) continue
    await commandManager.delete(cmd.id).catch(() => {})
    deleted++
  }
  return { deleted }
}

async function registerSlashCommands (client, { cleanupDeprecated = true, cleanupPaceMs = 200 } = {}) {
  const { all, global, dropped } = splitForGlobalLimit(client?.slashArray)
  const app = client?.application

  if (!app?.commands?.set) return { ok: false, reason: 'no_application' }

  const deprecatedNames = cleanupDeprecated ? getDeprecatedCommandNames(client) : []

  const res = {
    ok: true,
    counts: {
      total: all.length,
      global: global.length,
      dropped: dropped.length
    },
    cleanup: { deprecatedDeletedGlobal: 0, deprecatedDeletedGuild: 0 }
  }

  // 1) Global overwrite (máx 100)
  await app.commands.set(global)

  // 2) Overflow como guild commands (máx 100)
  if (deprecatedNames.length && String(process.env.GUILD_COMMAND_CLEANUP_DISABLED || '').trim() !== '1') {
    // Limpia comandos legacy en guilds (ej: ticket-close) que quedaron registrados en el pasado.
    const guilds = Array.from(client.guilds.cache.values())
    for (const guild of guilds) {
      const r = await deleteCommandsByName(guild.commands, deprecatedNames)
      res.cleanup.deprecatedDeletedGuild += r.deleted
      if (cleanupPaceMs > 0) await sleep(cleanupPaceMs)
    }

    // Best-effort: si algo quedó global por inconsistencias, también lo borra.
    const g = await deleteCommandsByName(app.commands, deprecatedNames)
    res.cleanup.deprecatedDeletedGlobal += g.deleted
  }

  return res
}

module.exports = {
  registerSlashCommands
}
