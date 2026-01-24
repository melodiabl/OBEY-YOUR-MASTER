const { AuditLogEvent, PermissionsBitField } = require('discord.js')
const TTLCache = require('../../core/cache/ttlCache')
const SecurityIncidentSchema = require('../../database/schemas/SecurityIncidentSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, headerLine } = require('../../core/ui/uiKit')

const raidJoinCache = new TTLCache({ defaultTtlMs: 60_000, maxSize: 50_000 })
const nukeCounterCache = new TTLCache({ defaultTtlMs: 60_000, maxSize: 200_000 })
const automodCooldownCache = new TTLCache({ defaultTtlMs: 15_000, maxSize: 500_000 })

function isModuleEnabled (guildData, key) {
  const modules = guildData?.modules
  if (!modules) return true
  if (typeof modules.get === 'function') return modules.get(key) !== false
  return modules?.[key] !== false
}

function normalizeList (v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter(Boolean).map(String)
  return [String(v)].filter(Boolean)
}

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function msToHuman (ms) {
  const s = Math.max(0, Math.floor(Number(ms || 0) / 1000))
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return `${s}s`
}

async function recordIncident ({ guildID, type, severity = 'med', actorID = null, targetID = null, meta = {} }) {
  try {
    return await new SecurityIncidentSchema({
      guildID,
      type,
      severity,
      actorID,
      targetID,
      meta
    }).save()
  } catch (e) {
    return null
  }
}

async function resolveAlertsChannel ({ guild, guildData }) {
  const id = guildData?.securityAlertsChannel || guildData?.logsChannel || null
  if (!id) return null
  return guild.channels.cache.get(id) || null
}

async function sendAlert ({ client, guild, guildData, title, lines, fields, severity = 'info' }) {
  try {
    const channel = await resolveAlertsChannel({ guild, guildData })
    if (!channel?.send) return false
    const ui = await getGuildUiConfig(client, guild.id)
    const e = embed({
      ui,
      system: 'security',
      kind: severity === 'error' ? 'error' : severity === 'warn' ? 'warn' : 'info',
      title: `${Emojis.security} ${title}`,
      description: [
        headerLine(Emojis.security, 'Alerta'),
        ...(Array.isArray(lines) ? lines : String(lines || '').split('\n')).filter(Boolean)
      ].join('\n'),
      fields: Array.isArray(fields) ? fields : undefined,
      signature: 'ProtecciÃ³n en tiempo real'
    })
    await channel.send({ embeds: [e] }).catch(() => {})
    return true
  } catch (e) {
    return false
  }
}

async function isWhitelisted ({ guild, guildData, userId }) {
  const uid = String(userId || '')
  if (!uid) return false
  const whitelistUsers = new Set(normalizeList(guildData?.securityWhitelistUsers))
  if (whitelistUsers.has(uid)) return true

  const roleIds = new Set(normalizeList(guildData?.securityWhitelistRoles))
  if (!roleIds.size) return false

  const member = await guild.members.fetch(uid).catch(() => null)
  if (!member) return false
  return member.roles.cache.some(r => roleIds.has(String(r.id)))
}

async function getRecentAuditExecutor ({ guild, auditType, maxAgeMs = 5000 }) {
  try {
    const audit = await guild.fetchAuditLogs({ type: auditType, limit: 1 })
    const entry = audit?.entries?.first()
    if (!entry) return null
    if (Date.now() - entry.createdTimestamp > maxAgeMs) return null
    return entry.executor || null
  } catch (e) {
    return null
  }
}

function getRaidState (guildId) {
  return raidJoinCache.get(`raid:${guildId}`) || { joins: [], raidModeUntil: 0 }
}

function setRaidState (guildId, state, ttlMs) {
  raidJoinCache.set(`raid:${guildId}`, state, ttlMs)
}

async function applyJoinAction ({ member, action, durationMs, reason }) {
  const a = String(action || 'none').toLowerCase()
  if (a === 'none') return { ok: true, action: 'none' }
  if (a === 'kick') {
    if (!member?.kickable) return { ok: false, action: 'kick', reason: 'No kickable (permisos/jerarquÃ­a).' }
    await member.kick(reason || 'Anti-raid').catch((e) => { throw e })
    return { ok: true, action: 'kick' }
  }
  if (a === 'timeout') {
    if (!member?.moderatable) return { ok: false, action: 'timeout', reason: 'No moderatable (permisos/jerarquÃ­a).' }
    const ms = clamp(durationMs, 5_000, 28 * 24 * 60 * 60_000)
    await member.timeout(ms, reason || 'Anti-raid').catch((e) => { throw e })
    return { ok: true, action: 'timeout', durationMs: ms }
  }
  return { ok: true, action: 'none' }
}

async function handleMemberJoin ({ client, member }) {
  const guild = member?.guild
  if (!guild) return { ok: false, reason: 'no_guild' }

  const guildData = await client.db.getGuildData(guild.id).catch(() => null)
  if (!guildData) return { ok: false, reason: 'no_guild_data' }
  if (!isModuleEnabled(guildData, 'security')) return { ok: true, skipped: 'module_off' }

  const now = Date.now()

  // 1) Alt detection (edad de cuenta)
  if (guildData.altDetectionEnabled) {
    const minAge = clamp(guildData.altMinAccountAgeMs, 0, 365 * 24 * 60 * 60_000)
    const created = Number(member?.user?.createdTimestamp || 0)
    const age = created ? now - created : null

    if (age !== null && age < minAge) {
      const action = String(guildData.altAction || 'timeout')
      const durationMs = clamp(guildData.altTimeoutMs, 5_000, 28 * 24 * 60 * 60_000)
      const res = await applyJoinAction({
        member,
        action,
        durationMs,
        reason: `Alt detection: cuenta < ${msToHuman(minAge)}`
      }).catch((e) => ({ ok: false, action, error: e?.message || String(e) }))

      await recordIncident({
        guildID: guild.id,
        type: 'alt',
        severity: 'med',
        actorID: member.id,
        targetID: member.id,
        meta: { minAgeMs: minAge, accountAgeMs: age, action, result: res }
      })

      await sendAlert({
        client,
        guild,
        guildData,
        title: 'Posible alt detectado',
        severity: 'warn',
        lines: [
          `${Emojis.dot} Usuario: ${member.user} ${Format.subtext(member.user.tag)}`,
          `${Emojis.dot} Edad cuenta: ${Format.inlineCode(msToHuman(age))} (min: ${Format.inlineCode(msToHuman(minAge))})`,
          `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(res.action || action)} ${res.durationMs ? Format.subtext(msToHuman(res.durationMs)) : ''}`,
          !res.ok ? `${Emojis.dot} Resultado: ${Format.inlineCode(res.error || res.reason || 'fallÃ³')}` : `${Emojis.dot} Resultado: ${Emojis.success} ok`
        ]
      })
    }
  }

  // 2) Anti-raid (rÃ¡faga de joins)
  if (guildData.antiRaidEnabled) {
    const windowMs = clamp(guildData.antiRaidJoinWindowMs, 2_000, 5 * 60_000)
    const threshold = clamp(guildData.antiRaidJoinThreshold, 2, 100)
    const action = String(guildData.antiRaidAction || 'timeout')
    const durationMs = clamp(guildData.antiRaidTimeoutMs, 5_000, 28 * 24 * 60 * 60_000)

    const state = getRaidState(guild.id)
    const joins = Array.isArray(state.joins) ? state.joins : []
    joins.push(now)
    const fresh = joins.filter(t => (now - Number(t || 0)) <= windowMs)

    let raidModeUntil = Math.max(Number(state.raidModeUntil || 0), Number(guildData.raidModeUntil || 0))
    const triggered = fresh.length >= threshold
    if (triggered) raidModeUntil = Math.max(raidModeUntil, now + durationMs)

    setRaidState(guild.id, { joins: fresh.slice(-200), raidModeUntil }, Math.max(windowMs, 30_000))

    if (triggered) {
      guildData.raidModeUntil = raidModeUntil
      await guildData.save().catch(() => {})

      await recordIncident({
        guildID: guild.id,
        type: 'raid',
        severity: 'high',
        actorID: member.id,
        targetID: member.id,
        meta: { windowMs, threshold, joins: fresh.length, action, durationMs }
      })

      await sendAlert({
        client,
        guild,
        guildData,
        title: 'Anti-raid activado',
        severity: 'error',
        lines: [
          `${Emojis.dot} Ventana: ${Format.inlineCode(msToHuman(windowMs))}`,
          `${Emojis.dot} Joins en ventana: ${Format.inlineCode(String(fresh.length))} (umbral: ${Format.inlineCode(String(threshold))})`,
          `${Emojis.dot} Raid mode: hasta <t:${Math.floor(raidModeUntil / 1000)}:R>`,
          `${Emojis.dot} AcciÃ³n joiners: ${Format.inlineCode(action)} ${action === 'timeout' ? Format.subtext(msToHuman(durationMs)) : ''}`
        ]
      })
    }

    // Si raid mode activo, aplica acciÃ³n a cada join (incluido el actual).
    if (raidModeUntil > now) {
      const res = await applyJoinAction({
        member,
        action,
        durationMs,
        reason: `Anti-raid: raid mode activo (${msToHuman(durationMs)})`
      }).catch((e) => ({ ok: false, action, error: e?.message || String(e) }))

      if (!res.ok) {
        await sendAlert({
          client,
          guild,
          guildData,
          title: 'Anti-raid: acciÃ³n bloqueada',
          severity: 'warn',
          lines: [
            `${Emojis.dot} Usuario: ${member.user} ${Format.subtext(member.user.tag)}`,
            `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(action)}`,
            `${Emojis.dot} Error: ${Format.inlineCode(res.error || res.reason || 'desconocido')}`
          ]
        })
      }
    }
  }

  return { ok: true }
}

function nukeKey (guildId, executorId, kind) {
  return `nuke:${guildId}:${executorId}:${kind}`
}

async function punishExecutor ({ guild, executorId, punishment, timeoutMs, reason }) {
  const p = String(punishment || 'none').toLowerCase()
  if (p === 'none') return { ok: true, punishment: 'none' }

  if (p === 'ban') {
    const member = await guild.members.fetch(executorId).catch(() => null)
    if (!member) return { ok: false, punishment: 'ban', reason: 'No pude obtener al miembro.' }
    if (!member.bannable) return { ok: false, punishment: 'ban', reason: 'No bannable (permisos/jerarquÃ­a).' }
    await member.ban({ reason: reason || 'Anti-nuke' }).catch((e) => { throw e })
    return { ok: true, punishment: 'ban' }
  }

  if (p === 'timeout') {
    const member = await guild.members.fetch(executorId).catch(() => null)
    if (!member) return { ok: false, punishment: 'timeout', reason: 'No pude obtener al miembro.' }
    if (!member.moderatable) return { ok: false, punishment: 'timeout', reason: 'No moderatable (permisos/jerarquÃ­a).' }
    const ms = clamp(timeoutMs, 5_000, 28 * 24 * 60 * 60_000)
    await member.timeout(ms, reason || 'Anti-nuke').catch((e) => { throw e })
    return { ok: true, punishment: 'timeout', timeoutMs: ms }
  }

  return { ok: true, punishment: 'none' }
}

async function handleNukeEvent ({ client, guild, kind, auditType, meta = {} }) {
  if (!guild) return { ok: false, reason: 'no_guild' }
  const guildData = await client.db.getGuildData(guild.id).catch(() => null)
  if (!guildData) return { ok: false, reason: 'no_guild_data' }
  if (!isModuleEnabled(guildData, 'security')) return { ok: true, skipped: 'module_off' }
  if (!guildData.antiNukeEnabled) return { ok: true, skipped: 'disabled' }

  const executor = await getRecentAuditExecutor({ guild, auditType })
  const executorId = executor?.id || null
  if (!executorId) return { ok: true, skipped: 'no_executor' }
  if (executorId === client.user.id) return { ok: true, skipped: 'self' }

  if (await isWhitelisted({ guild, guildData, userId: executorId })) {
    return { ok: true, skipped: 'whitelisted', executorId }
  }

  const windowMs = clamp(guildData.antiNukeWindowMs, 2_000, 5 * 60_000)
  const threshold = clamp(guildData.antiNukeThreshold, 2, 50)

  const k = nukeKey(guild.id, executorId, kind)
  const current = nukeCounterCache.get(k) || { count: 0, firstAt: Date.now() }
  current.count += 1
  const ttl = windowMs
  nukeCounterCache.set(k, current, ttl)

  const triggered = current.count >= threshold
  if (!triggered) return { ok: true, executorId, count: current.count, triggered: false }

  const punishment = String(guildData.antiNukePunishment || 'timeout')
  const timeoutMs = clamp(guildData.antiNukeTimeoutMs, 5_000, 28 * 24 * 60 * 60_000)

  const res = await punishExecutor({
    guild,
    executorId,
    punishment,
    timeoutMs,
    reason: `Anti-nuke: ${kind} x${current.count} en ${msToHuman(windowMs)}`
  }).catch((e) => ({ ok: false, punishment, error: e?.message || String(e) }))

  await recordIncident({
    guildID: guild.id,
    type: 'nuke',
    severity: 'high',
    actorID: executorId,
    targetID: executorId,
    meta: {
      kind,
      windowMs,
      threshold,
      count: current.count,
      punishment,
      timeoutMs,
      result: res,
      ...meta
    }
  })

  await sendAlert({
    client,
    guild,
    guildData,
    title: 'Posible nuke detectado',
    severity: 'error',
    lines: [
      `${Emojis.dot} Executor: <@${executorId}> ${Format.subtext(executor?.tag || '')}`,
      `${Emojis.dot} Evento: ${Format.inlineCode(kind)}`,
      `${Emojis.dot} Conteo: ${Format.inlineCode(String(current.count))} (umbral: ${Format.inlineCode(String(threshold))} en ${Format.inlineCode(msToHuman(windowMs))})`,
      `${Emojis.dot} Castigo: ${Format.inlineCode(res.punishment || punishment)} ${res.timeoutMs ? Format.subtext(msToHuman(res.timeoutMs)) : ''}`,
      !res.ok ? `${Emojis.dot} Resultado: ${Format.inlineCode(res.error || res.reason || 'fallÃ³')}` : `${Emojis.dot} Resultado: ${Emojis.success} ok`
    ]
  })

  return { ok: true, executorId, count: current.count, triggered: true, result: res }
}

async function listIncidents ({ guildID, limit = 10 }) {
  const lim = clamp(limit, 1, 50)
  return SecurityIncidentSchema.find({ guildID }).sort({ createdAt: -1 }).limit(lim)
}

async function resolveIncident ({ guildID, incidentId }) {
  const id = String(incidentId || '').trim()
  if (!id) throw new Error('ID invÃ¡lida.')
  const doc = await SecurityIncidentSchema.findOne({ _id: id, guildID })
  if (!doc) throw new Error('No existe ese incidente.')
  if (doc.resolvedAt) return doc
  doc.resolvedAt = new Date()
  await doc.save()
  return doc
}

module.exports = {
  AuditLogEvent,
  handleMemberJoin,
  handleNukeEvent,
  handleMessageAutomod,
  recordIncident,
  listIncidents,
  resolveIncident
}

async function handleMessageAutomod ({ client, message }) {
  if (!message?.guild || !message?.channel) return { ok: false, reason: 'no_guild' }
  if (!message?.author || message.author.bot) return { ok: true, skipped: 'bot' }

  const guildData = await client.db.getGuildData(message.guild.id).catch(() => null)
  if (!guildData) return { ok: false, reason: 'no_guild_data' }
  if (!isModuleEnabled(guildData, 'security')) return { ok: true, skipped: 'module_off' }
  if (!guildData.automodEnabled) return { ok: true, skipped: 'disabled' }

  // Bypass para mods/admins por permisos Discord.
  try {
    if (message.member?.permissions?.has?.(PermissionsBitField.Flags.ManageMessages)) return { ok: true, skipped: 'manage_messages' }
    if (message.member?.permissions?.has?.(PermissionsBitField.Flags.ModerateMembers)) return { ok: true, skipped: 'moderate_members' }
    if (await isWhitelisted({ guild: message.guild, guildData, userId: message.author.id })) return { ok: true, skipped: 'whitelisted' }
  } catch (e) {}

  const cdKey = `${message.guild.id}:${message.author.id}:automod`
  if (automodCooldownCache.get(cdKey)) return { ok: true, skipped: 'cooldown' }
  automodCooldownCache.set(cdKey, true, 15_000)

  const content = String(message.content || '')
  const lowered = content.toLowerCase()

  const reasons = []
  let rule = null

  // Invites
  if (guildData.automodBlockInvites) {
    const inviteRe = /(https?:\/\/)?(www\.)?(discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i
    if (inviteRe.test(content)) {
      rule = 'invites'
      reasons.push('Link de invitación no permitido.')
    }
  }

  // Bad words (exact contains)
  if (!rule) {
    const bad = Array.isArray(guildData.automodBadWords) ? guildData.automodBadWords : []
    const hit = bad.find(w => {
      const s = String(w || '').trim().toLowerCase()
      return s && lowered.includes(s)
    })
    if (hit) {
      rule = 'badword'
      reasons.push('Contenido no permitido por filtro de palabras.')
    }
  }

  // Mass mentions
  if (!rule) {
    const max = clamp(guildData.automodMaxMentions, 1, 50)
    const mentions = (message.mentions?.users?.size || 0) + (message.mentions?.roles?.size || 0)
    const effective = message.mentions?.everyone ? max + 1 : mentions
    if (effective > max) {
      rule = 'mentions'
      reasons.push(`Demasiadas menciones (${effective} > ${max}).`)
    }
  }

  if (!rule) return { ok: true, skipped: 'no_match' }

  // Acciones
  const action = String(guildData.automodAction || 'warn').toLowerCase()
  const timeoutMs = clamp(guildData.automodTimeoutMs, 5_000, 28 * 24 * 60 * 60_000)
  const reason = `AutoMod: ${rule} â€” ${reasons.join(' ')}`

  // 1) Borra el mensaje (best-effort)
  try { await message.delete().catch(() => {}) } catch (e) {}

  // 2) Registra incidente y alerta
  await recordIncident({
    guildID: message.guild.id,
    type: 'behavior',
    severity: rule === 'invites' ? 'high' : 'med',
    actorID: message.author.id,
    targetID: message.author.id,
    meta: { rule, action, channelId: message.channel.id }
  })

  await sendAlert({
    client,
    guild: message.guild,
    guildData,
    title: 'AutoMod',
    severity: rule === 'invites' ? 'warn' : 'info',
    lines: [
      `${Emojis.dot} Regla: ${Format.inlineCode(rule)}`,
      `${Emojis.dot} Usuario: ${message.author} ${Format.subtext(message.author.tag)}`,
      `${Emojis.dot} Canal: ${message.channel}`,
      `${Emojis.dot} Acción: ${Format.inlineCode(action)}${action === 'timeout' ? Format.subtext(msToHuman(timeoutMs)) : ''}`,
      `${Emojis.quote} ${Format.italic(reasons.join(' '))}`
    ]
  })

  // 3) Warn/timeout (si aplica)
  try {
    const moderation = require('../moderation/moderationService')
    const { applyWarnPolicy } = require('../moderation/warnThresholdService')

    if (action === 'warn') {
      const res = await moderation.warnUser({
        guildID: message.guild.id,
        targetID: message.author.id,
        moderatorID: client.user.id,
        reason
      })
      await applyWarnPolicy({
        client,
        guild: message.guild,
        guildData,
        targetID: message.author.id,
        moderatorID: client.user.id,
        warnsCount: res.warnsCount
      }).catch(() => {})
    }

    if (action === 'timeout') {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null)
      if (member?.moderatable) {
        await member.timeout(timeoutMs, reason).catch(() => {})
        await moderation.logAction({
          guildID: message.guild.id,
          type: 'timeout',
          targetID: message.author.id,
          moderatorID: client.user.id,
          reason,
          meta: { auto: true, via: 'automod', rule, durationMs: timeoutMs }
        }).catch(() => {})
      }
    }
  } catch (e) {}

  return { ok: true, triggered: true, rule, action }
}
