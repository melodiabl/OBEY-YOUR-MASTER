const TTLCache = require('../../core/cache/ttlCache')
const { resolveInternalIdentity } = require('../../core/auth/resolveInternalIdentity')
const { authorizeInternal } = require('../../core/auth/authorize')
const { audit } = require('../../core/audit/auditService')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, errorEmbed, embed } = require('../../core/ui/uiKit')
const { handlePanelInteraction } = require('../../core/ui/panels/panelKit')

const globalCooldownCache = new TTLCache({ defaultTtlMs: 5_000, maxSize: 200_000 })
const commandCooldownCache = new TTLCache({ defaultTtlMs: 10_000, maxSize: 500_000 })

function key (guildId, userId, suffix) {
  return `${guildId}:${userId}:${suffix}`
}

function normalizeOverridesMap (v) {
  if (!v) return null
  if (typeof v.get === 'function') return v
  if (typeof v === 'object') return new Map(Object.entries(v))
  return null
}

function pickOverride (map, { commandName, groupName, subcommandName }) {
  if (!map) return null
  const candidates = []
  if (groupName && subcommandName) candidates.push(`${commandName} ${groupName}.${subcommandName}`)
  if (subcommandName) candidates.push(`${commandName} ${subcommandName}`)
  candidates.push(`${commandName}`)

  for (const c of candidates) {
    const v = map.get ? map.get(c) : null
    if (v) return { key: c, value: v }
  }
  return null
}

function getOverrideField (overrideValue, k) {
  if (!overrideValue) return undefined
  if (typeof overrideValue.get === 'function') return overrideValue.get(k)
  return overrideValue[k]
}

async function replySafe (interaction, payload) {
  try {
    if (interaction.deferred || interaction.replied) return await interaction.editReply(payload)
    return await interaction.reply(payload)
  } catch (e) {
    try {
      if (interaction.deferred || interaction.replied) return await interaction.followUp(payload)
    } catch (_) {}
  }
}

module.exports = async (client, interaction) => {
  try {
    if (!interaction.guild || !interaction.channel) return

    // Panel premium (botones / menú)
    try {
      const handled = await handlePanelInteraction(client, interaction)
      if (handled) return
    } catch (e) {}

    // Menú help
    if (interaction.isStringSelectMenu?.()) {
      if (interaction.customId === 'help_menu') {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const category = interaction.values[0]
        const commands = client.slashCommands.filter(c => c.CATEGORY === category)
        const list = commands.map(c => `${Emojis.dot} ${Format.bold('/' + c.CMD.name)} *${c.CMD.description}*`).join('\n') || '*Sin comandos en esta categoría.*'

        const e = embed({
          ui,
          system: 'info',
          kind: 'info',
          title: `${Emojis.info} Ayuda`,
          description: [
            `${Emojis.category} **Categoría:** ${Format.inlineCode(category)}`,
            Format.softDivider(20),
            list
          ].join('\n')
        })

        return await interaction.update({ embeds: [e] }).catch(() => {})
      }
    }

    // Autocomplete
    if (interaction.isAutocomplete?.()) {
      const cmd = client.slashCommands.get(interaction.commandName)
      if (cmd?.autocomplete) {
        try {
          return await cmd.autocomplete(client, interaction)
        } catch (e) {
          return
        }
      }
      return
    }

    if (!interaction.isChatInputCommand?.()) return

    // Compat (JsonDB)
    const GUILD_DATA = client.dbGuild.getGuildData(interaction.guild.id)

    const COMANDO = client.slashCommands.get(interaction.commandName)
    if (!COMANDO) return

    const guildMongo = await client.db.getGuildData(interaction.guild.id)
    const ui = await getGuildUiConfig(client, interaction.guild.id)

    const groupName = interaction.options.getSubcommandGroup(false)
    const subcommandName = interaction.options.getSubcommand(false)

    // Override por comando/subcomando (servidor)
    const overrides = normalizeOverridesMap(guildMongo?.commandOverrides)
    const picked = pickOverride(overrides, { commandName: interaction.commandName, groupName, subcommandName })
    const ov = picked?.value || null

    // Modo mantenimiento
    if (guildMongo?.maintenanceEnabled) {
      const allow = new Set(['help', 'auth', 'config', 'modules', 'maintenance'])
      if (!allow.has(interaction.commandName)) {
        const msg = String(guildMongo?.maintenanceMessage || 'El bot está en mantenimiento. Intenta más tarde.')
        const e = errorEmbed({ ui, system: 'security', title: 'Mantenimiento', reason: msg, hint: `Comando: ${Format.inlineCode('/' + interaction.commandName)}` })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }
    }

    // Visibilidad (solo afecta defer y errores del middleware)
    const overrideVisibility = String(getOverrideField(ov, 'visibility') || '').trim().toLowerCase()
    const defaultEphemeral = overrideVisibility === 'ephemeral'
      ? true
      : overrideVisibility === 'public'
        ? false
        : Boolean(COMANDO.EPHEMERAL || false)

    if (COMANDO.DEFER) {
      await interaction.deferReply({ ephemeral: defaultEphemeral }).catch(() => {})
    }

    // Cooldown global por servidor (anti-abuso base)
    try {
      const ms = Number(guildMongo?.globalCooldownMs || 0)
      if (ms > 0) {
        const until = globalCooldownCache.get(key(interaction.guild.id, interaction.user.id, 'global'))
        if (until && until > Date.now()) {
          const remaining = Math.ceil((until - Date.now()) / 1000)
          return replySafe(interaction, {
            embeds: [errorEmbed({ ui, system: 'security', title: 'Demasiado rápido', reason: `Espera ${remaining}s antes de usar más comandos.`, hint: 'Esto protege al servidor contra abuso.' })],
            ephemeral: true
          })
        }
        globalCooldownCache.set(key(interaction.guild.id, interaction.user.id, 'global'), Date.now() + ms, ms)
      }
    } catch (e) {}

    // OWNER (bot)
    if (COMANDO.OWNER) {
      const owners = String(process.env.OWNER_IDS || '').split(/\s+/).filter(Boolean)
      if (!owners.includes(interaction.user.id)) {
        const e = errorEmbed({
          ui,
          system: 'security',
          title: 'Acceso restringido',
          reason: 'Solo el equipo del bot puede ejecutar este comando.',
          hint: owners.length ? `Owners: ${owners.map(id => `<@${id}>`).join(' ')}` : null
        })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }
    }

    // Permisos nativos Discord
    if (COMANDO.BOT_PERMISSIONS) {
      if (!interaction.guild.members.me.permissions.has(COMANDO.BOT_PERMISSIONS)) {
        const e = errorEmbed({
          ui,
          system: 'security',
          title: 'Permisos faltantes',
          reason: 'No tengo permisos suficientes para ejecutar esto.',
          hint: `Necesito: ${COMANDO.BOT_PERMISSIONS.map(p => Format.inlineCode(p)).join(', ')}`
        })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }
    }

    if (COMANDO.PERMISSIONS) {
      if (!interaction.member.permissions.has(COMANDO.PERMISSIONS)) {
        const e = errorEmbed({
          ui,
          system: 'security',
          title: 'Permisos requeridos',
          reason: 'No tienes permisos suficientes para ejecutar esto.',
          hint: `Necesitas: ${COMANDO.PERMISSIONS.map(p => Format.inlineCode(p)).join(', ')}`
        })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }
    }

    // Módulos por servidor (si el comando lo declara)
    if (COMANDO.MODULE) {
      try {
        const alwaysAllowed = new Set(['modules', 'auth', 'security', 'config', 'help', 'maintenance', 'overrides', 'plugins'])
        if (!alwaysAllowed.has(interaction.commandName)) {
          const modules = guildMongo?.modules
          const isOff = modules?.get ? modules.get(COMANDO.MODULE) === false : modules?.[COMANDO.MODULE] === false
          if (isOff) {
            const e = errorEmbed({
              ui,
              system: 'config',
              title: 'Módulo deshabilitado',
              reason: `El módulo ${Format.inlineCode(COMANDO.MODULE)} está deshabilitado en este servidor.`,
              hint: `Admin: usa ${Format.inlineCode('/modules set')} para activarlo.`
            })
            return replySafe(interaction, { embeds: [e], ephemeral: true })
          }
        }
      } catch (e) {}
    }

    // Overrides por comando (enabled / cooldown / auth)
    if (ov) {
      const enabled = getOverrideField(ov, 'enabled')
      if (enabled === false) {
        const e = errorEmbed({ ui, system: 'config', title: 'Comando deshabilitado', reason: 'Este comando fue deshabilitado por configuración del servidor.' })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }

      const cooldownMs = Number(getOverrideField(ov, 'cooldownMs') || 0)
      if (cooldownMs > 0) {
        const cdKey = key(interaction.guild.id, interaction.user.id, `cmd:${picked?.key || interaction.commandName}`)
        const until = commandCooldownCache.get(cdKey)
        if (until && until > Date.now()) {
          const remaining = Math.ceil((until - Date.now()) / 1000)
          const e = errorEmbed({ ui, system: 'security', title: 'Cooldown', reason: `Espera ${remaining}s para volver a usar este comando.` })
          return replySafe(interaction, { embeds: [e], ephemeral: true })
        }
        commandCooldownCache.set(cdKey, Date.now() + cooldownMs, cooldownMs)
      }
    }

    // Autorización interna (comando + override)
    if (COMANDO.INTERNAL_ROLE || COMANDO.INTERNAL_PERMS || getOverrideField(ov, 'role') || getOverrideField(ov, 'perms')) {
      const identity = await resolveInternalIdentity({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        member: interaction.member
      })

      const requiredRole = getOverrideField(ov, 'role') || COMANDO.INTERNAL_ROLE
      const requiredPerms = getOverrideField(ov, 'perms') || COMANDO.INTERNAL_PERMS

      const authz = authorizeInternal({
        identity,
        requiredRole,
        requiredPerms
      })

      if (!authz.ok) {
        const e = errorEmbed({
          ui,
          system: 'security',
          title: 'Acceso denegado',
          reason: authz.reason,
          hint: `${Emojis.dot} Requerido: ${Format.inlineCode(requiredRole || '—')}`
        })
        return replySafe(interaction, { embeds: [e], ephemeral: true })
      }
    }

    const startedAt = Date.now()
    try {
      await COMANDO.execute(client, interaction, '/', GUILD_DATA)
      await audit({
        client,
        guild: interaction.guild,
        payload: {
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          action: `slash.${interaction.commandName}`,
          ok: true,
          createdAt: new Date(),
          meta: {
            commandName: interaction.commandName,
            durationMs: Date.now() - startedAt
          }
        }
      })
    } catch (e) {
      const msg = e?.message || String(e || 'Error desconocido')
      const err = errorEmbed({
        ui,
        system: 'security',
        title: 'Error ejecutando comando',
        reason: msg,
        hint: `Comando: ${Format.inlineCode('/' + interaction.commandName)}`
      })
      await replySafe(interaction, { embeds: [err], ephemeral: true })

      await audit({
        client,
        guild: interaction.guild,
        payload: {
          guildID: interaction.guild.id,
          actorID: interaction.user.id,
          action: `slash.${interaction.commandName}`,
          ok: false,
          createdAt: new Date(),
          meta: {
            commandName: interaction.commandName,
            error: msg
          }
        }
      })
      console.log(e)
    }
  } catch (e) {
    console.log(e)
  }
}
