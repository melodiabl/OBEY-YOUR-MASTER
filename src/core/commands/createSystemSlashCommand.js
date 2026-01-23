const { SlashCommandBuilder } = require('discord.js')
const TTLCache = require('../cache/ttlCache')
const { resolveInternalIdentity } = require('../auth/resolveInternalIdentity')
const { authorizeInternal } = require('../auth/authorize')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, errorEmbed, warnEmbed, safeReply } = require('../ui/uiKit')

const cooldownCache = new TTLCache({ defaultTtlMs: 60_000, maxSize: 200_000 })

function normalizeList (v) {
  if (!v) return []
  if (Array.isArray(v)) return v.filter(Boolean)
  return [v].filter(Boolean)
}

function requireString (value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Falta ${label} (string)`)
  return value.trim()
}

function applyOptions (subcommandBuilder, optionSpecs) {
  const specs = normalizeList(optionSpecs)
  for (const opt of specs) {
    if (!opt || typeof opt !== 'object') continue
    if (typeof opt.apply !== 'function') continue
    opt.apply(subcommandBuilder)
  }
}

function makeCooldownKey ({ guildId, userId, commandName, subcommandName }) {
  return `${guildId}:${userId}:${commandName}:${subcommandName}`
}

function getCooldownRemainingMs (key) {
  const until = cooldownCache.get(key)
  if (!until) return 0
  const remaining = until - Date.now()
  return remaining > 0 ? remaining : 0
}

function setCooldown (key, ms) {
  cooldownCache.set(key, Date.now() + ms, ms)
}

function createSystemSlashCommand ({
  name,
  description,
  moduleKey,
  // [{ name, description, options, cooldownMs, auth: { role, perms }, handler }]
  subcommands = [],
  // [{ name, description, subcommands: [...] }]
  groups = [],
  // (client, interaction) => interaction.respond([...])
  autocomplete = null,
  defaultAuth = { role: null, perms: [] },
  defaultCooldownMs = 0
} = {}) {
  const cmdName = requireString(name, 'name')
  const cmdDesc = requireString(description, 'description')

  const builder = new SlashCommandBuilder()
    .setName(cmdName)
    .setDescription(cmdDesc)

  const registry = new Map()
  const groupRegistry = new Map()

  for (const sc of subcommands) {
    if (!sc || typeof sc !== 'object') continue
    const scName = requireString(sc.name, 'subcommand.name')
    const scDesc = requireString(sc.description, 'subcommand.description')
    if (registry.has(scName)) throw new Error(`Subcommand duplicado: ${scName}`)
    registry.set(scName, sc)

    builder.addSubcommand((sub) => {
      sub.setName(scName).setDescription(scDesc)
      applyOptions(sub, sc.options)
      return sub
    })
  }

  for (const group of normalizeList(groups)) {
    if (!group || typeof group !== 'object') continue
    const gName = requireString(group.name, 'group.name')
    const gDesc = requireString(group.description, 'group.description')
    if (groupRegistry.has(gName)) throw new Error(`Grupo duplicado: ${gName}`)
    groupRegistry.set(gName, new Map())

    const gMap = groupRegistry.get(gName)
    for (const sc of normalizeList(group.subcommands)) {
      if (!sc || typeof sc !== 'object') continue
      const scName = requireString(sc.name, 'subcommand.name')
      requireString(sc.description, 'subcommand.description')
      if (gMap.has(scName)) throw new Error(`Subcommand duplicado: ${gName}.${scName}`)
      gMap.set(scName, sc)
    }

    builder.addSubcommandGroup((g) => {
      g.setName(gName).setDescription(gDesc)
      for (const [scName, sc] of gMap.entries()) {
        g.addSubcommand((sub) => {
          sub.setName(scName).setDescription(sc.description)
          applyOptions(sub, sc.options)
          return sub
        })
      }
      return g
    })
  }

  return {
    MODULE: moduleKey,
    CMD: builder,
    autocomplete,
    async execute (client, interaction) {
      const ui = await getGuildUiConfig(client, interaction.guild.id)
      const groupName = interaction.options.getSubcommandGroup(false)
      const subcommandName = interaction.options.getSubcommand()
      const spec = groupName
        ? groupRegistry.get(groupName)?.get(subcommandName)
        : registry.get(subcommandName)
      if (!spec) {
        const e = errorEmbed({
          ui,
          system: moduleKey || 'utility',
          title: 'Subcomando inválido',
          reason: `No existe: ${Format.inlineCode(groupName ? `${groupName}.${subcommandName}` : subcommandName)}`,
          hint: `Usa ${Format.inlineCode('/help')} para ver comandos disponibles.`
        })
        return safeReply(interaction, { embeds: [e], ephemeral: true })
      }

      const identity = await resolveInternalIdentity({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        member: interaction.member
      })

      const authSpec = spec.auth || defaultAuth
      const authz = authorizeInternal({
        identity,
        requiredRole: authSpec?.role || null,
        requiredPerms: authSpec?.perms || []
      })

      if (!authz.ok) {
        const e = errorEmbed({
          ui,
          system: moduleKey || 'security',
          title: 'Acceso denegado',
          reason: authz.reason,
          hint: `${Emojis.dot} Si creés que es un error, pedí a un admin que revise ${Format.inlineCode('/auth')} y ${Format.inlineCode('/overrides')}.`
        })
        return safeReply(interaction, { embeds: [e], ephemeral: true })
      }

      const cooldownMs = Number(spec.cooldownMs ?? defaultCooldownMs) || 0
      if (cooldownMs > 0) {
        const key = makeCooldownKey({
          guildId: interaction.guild.id,
          userId: interaction.user.id,
          commandName: cmdName,
          subcommandName: groupName ? `${groupName}.${subcommandName}` : subcommandName
        })
        const remaining = getCooldownRemainingMs(key)
        if (remaining > 0) {
          const seconds = Math.ceil(remaining / 1000)
          const shown = groupName ? `${groupName} ${subcommandName}` : subcommandName
          const e = warnEmbed({
            ui,
            system: moduleKey || 'security',
            title: 'Cooldown',
            lines: [
              `${Emojis.dot} Espera ${Format.bold(`${seconds}s`)} para volver a usar ${Format.inlineCode(`/${cmdName} ${shown}`)}.`,
              `${Emojis.dot} Tip: algunos cooldowns se pueden ajustar en ${Format.inlineCode('/overrides set')}.`
            ]
          })
          return safeReply(interaction, { embeds: [e], ephemeral: true })
        }
        setCooldown(key, cooldownMs)
      }

      try {
        return await spec.handler(client, interaction, { identity, ui })
      } catch (e) {
        const msg = e?.message || String(e || 'Error desconocido')
        const shown = groupName ? `${groupName} ${subcommandName}` : subcommandName
        const err = errorEmbed({
          ui,
          system: moduleKey || 'security',
          title: 'Error ejecutando comando',
          reason: msg,
          hint: `Ruta: ${Format.inlineCode(`/${cmdName} ${shown}`)}`
        })
        return safeReply(interaction, { embeds: [err], ephemeral: true })
      }
    }
  }
}

module.exports = { createSystemSlashCommand }
