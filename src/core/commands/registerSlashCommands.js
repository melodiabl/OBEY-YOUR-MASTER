function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function splitForDiscordLimits (slashArray) {
  const all = Array.isArray(slashArray) ? slashArray.filter(Boolean) : []
  const GLOBAL_MAX = 100
  const GUILD_MAX = 100

  const global = all.slice(0, GLOBAL_MAX)
  const overflow = all.slice(GLOBAL_MAX, GLOBAL_MAX + GUILD_MAX)
  const dropped = all.slice(GLOBAL_MAX + GUILD_MAX)

  return { all, global, overflow, dropped }
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

async function upsertGuildCommands (guild, commandJsons) {
  if (!guild?.commands?.fetch || !guild?.commands?.create) return
  if (!commandJsons.length) return

  const existing = await guild.commands.fetch().catch(() => null)
  for (const cmd of commandJsons) {
    const name = cmd?.name
    if (!name) continue
    const current = existing?.find?.(c => c?.name === name) || null
    if (current) {
      await guild.commands.edit(current.id, cmd).catch(() => {})
    } else {
      await guild.commands.create(cmd).catch(() => {})
    }
  }
}

async function registerSlashCommands (client, { paceMs = 0, cleanupDeprecated = true, cleanupPaceMs = 200 } = {}) {
  const { all, global, overflow, dropped } = splitForDiscordLimits(client?.slashArray)
  const app = client?.application

  if (!app?.commands?.set) return { ok: false, reason: 'no_application' }

  const deprecatedNames = cleanupDeprecated ? getDeprecatedCommandNames(client) : []

  const res = {
    ok: true,
    counts: {
      total: all.length,
      global: global.length,
      overflow: overflow.length,
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

  if (overflow.length) {
    const guilds = Array.from(client.guilds.cache.values())
    for (const guild of guilds) {
      await upsertGuildCommands(guild, overflow)
      if (paceMs > 0) await sleep(paceMs)
    }
  }

  return res
}

async function registerOverflowForGuild (client, guild) {
  const { overflow } = splitForDiscordLimits(client?.slashArray)
  await upsertGuildCommands(guild, overflow)
  const deprecatedNames = getDeprecatedCommandNames(client)
  if (deprecatedNames.length && String(process.env.GUILD_COMMAND_CLEANUP_DISABLED || '').trim() !== '1') {
    await deleteCommandsByName(guild.commands, deprecatedNames)
  }
  return { ok: true, overflow: overflow.length }
}

module.exports = {
  registerSlashCommands,
  registerOverflowForGuild,
  splitForDiscordLimits
}
