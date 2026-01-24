const { ChannelType } = require('discord.js')
const ms = require('ms')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyInfo, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

function ensureArray (v) {
  if (!v) return []
  if (Array.isArray(v)) return v
  return [v]
}

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function parseDuration (value, { minMs, maxMs, label } = {}) {
  const raw = String(value || '').trim()
  const parsed = ms(raw)
  if (!parsed || !Number.isFinite(parsed)) throw new Error(`${label || 'DuraciÃ³n'} invÃ¡lida.`)
  const clamped = clamp(parsed, minMs ?? 0, maxMs ?? parsed)
  if (minMs && clamped < minMs) throw new Error(`${label || 'DuraciÃ³n'} demasiado corta.`)
  if (maxMs && clamped > maxMs) throw new Error(`${label || 'DuraciÃ³n'} demasiado larga.`)
  return clamped
}

function onOff (v) {
  return v ? `${Emojis.success} on` : `${Emojis.error} off`
}

module.exports = createSystemSlashCommand({
  name: 'security',
  description: 'Seguridad y protecciÃ³n (anti-raid / anti-nuke / alt / alertas)',
  moduleKey: 'security',
  subcommands: [
    {
      name: 'status',
      description: 'Muestra estado y configuraciÃ³n',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.SECURITY_VIEW] },
      handler: async (client, interaction) => {
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const modules = guildData?.modules
        const securityEnabled = modules?.get ? modules.get('security') !== false : modules?.security !== false

        const raidModeUntil = Number(guildData.raidModeUntil || 0)
        const raidActive = raidModeUntil > Date.now()

        const alertChannelId = guildData.securityAlertsChannel || guildData.logsChannel || null

        return replyEmbed(client, interaction, {
          system: 'security',
          kind: 'info',
          title: `${Emojis.security} Seguridad`,
          description: [
            headerLine(Emojis.security, 'Estado'),
            `${Emojis.dot} MÃ³dulo: ${onOff(securityEnabled)}`,
            `${Emojis.dot} Alertas: ${alertChannelId ? `<#${alertChannelId}>` : Format.italic('sin canal (configura logs/alertas)')}`,
            `${Emojis.dot} Raid mode: ${raidActive ? `${Emojis.warn} activo hasta <t:${Math.floor(raidModeUntil / 1000)}:R>` : `${Emojis.success} inactivo`}`
          ].join('\n'),
          fields: [
            {
              name: `${Emojis.lock} Anti-raid`,
              value: [
                `${Emojis.dot} Enabled: ${onOff(Boolean(guildData.antiRaidEnabled))}`,
                `${Emojis.dot} Ventana: ${Format.inlineCode(`${guildData.antiRaidJoinWindowMs || 0}ms`)}`,
                `${Emojis.dot} Umbral: ${Format.inlineCode(String(guildData.antiRaidJoinThreshold || 0))}`,
                `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(String(guildData.antiRaidAction || 'timeout'))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.antiRaidTimeoutMs || 0, { long: true }))}`
              ].join('\n'),
              inline: true
            },
            {
              name: `${Emojis.security} Anti-nuke`,
              value: [
                `${Emojis.dot} Enabled: ${onOff(Boolean(guildData.antiNukeEnabled))}`,
                `${Emojis.dot} Ventana: ${Format.inlineCode(`${guildData.antiNukeWindowMs || 0}ms`)}`,
                `${Emojis.dot} Umbral: ${Format.inlineCode(String(guildData.antiNukeThreshold || 0))}`,
                `${Emojis.dot} Castigo: ${Format.inlineCode(String(guildData.antiNukePunishment || 'timeout'))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.antiNukeTimeoutMs || 0, { long: true }))}`
              ].join('\n'),
              inline: true
            },
            {
              name: `${Emojis.human} Alt detection`,
              value: [
                `${Emojis.dot} Enabled: ${onOff(Boolean(guildData.altDetectionEnabled))}`,
                `${Emojis.dot} Edad mÃ­n: ${Format.inlineCode(ms(guildData.altMinAccountAgeMs || 0, { long: true }))}`,
                `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(String(guildData.altAction || 'timeout'))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.altTimeoutMs || 0, { long: true }))}`
              ].join('\n'),
              inline: true
            },
            {
              name: `${Emojis.role} Whitelist`,
              value: [
                `${Emojis.dot} Users: ${Format.inlineCode(String(ensureArray(guildData.securityWhitelistUsers).length))}`,
                `${Emojis.dot} Roles: ${Format.inlineCode(String(ensureArray(guildData.securityWhitelistRoles).length))}`
              ].join('\n'),
              inline: true
            }
          ],
          signature: `Tip: ${Format.inlineCode('/security raid enable')} ${Emojis.dot} ${Format.inlineCode('/security nuke enable')}`
        }, { ephemeral: true })
      }
    }
  ],
  groups: [
    {
      name: 'alerts',
      description: 'Canal de alertas (si no, usa logs)',
      subcommands: [
        {
          name: 'set',
          description: 'Define el canal de alertas de seguridad',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addChannelOption(o => o.setName('canal').setDescription('Canal de texto').setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)) }
          ],
          handler: async (client, interaction) => {
            const channel = interaction.options.getChannel('canal', true)
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.securityAlertsChannel = channel.id
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Alertas actualizadas',
              lines: [
                `${Emojis.dot} Canal: ${channel}`,
                `${Emojis.dot} Fallback: logsChannel si este canal no existe`
              ]
            }, { ephemeral: true })
          }
        },
        {
          name: 'reset',
          description: 'Vuelve a usar logsChannel como canal de alertas',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.securityAlertsChannel = null
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Alertas reseteadas',
              lines: [`${Emojis.dot} Ahora se usarÃ¡ ${guildData.logsChannel ? `<#${guildData.logsChannel}>` : Format.italic('logsChannel no configurado')}`]
            }, { ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'raid',
      description: 'Anti-raid (joins masivos)',
      subcommands: [
        {
          name: 'enable',
          description: 'Activa/desactiva anti-raid',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('true=on / false=off').setRequired(true)) }
          ],
          handler: async (client, interaction) => {
            const active = Boolean(interaction.options.getBoolean('activo', true))
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.antiRaidEnabled = active
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Anti-raid actualizado',
              lines: [`${Emojis.dot} Estado: ${active ? `${Emojis.success} on` : `${Emojis.error} off`}`]
            }, { ephemeral: true })
          }
        },
        {
          name: 'config',
          description: 'Ajusta ventana/umbral/acciÃ³n',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addIntegerOption(o => o.setName('ventana_ms').setDescription('Ventana de detecciÃ³n (ms)').setRequired(false).setMinValue(2000).setMaxValue(300000)) },
            { apply: (sub) => sub.addIntegerOption(o => o.setName('umbral').setDescription('Joins en ventana').setRequired(false).setMinValue(2).setMaxValue(100)) },
            {
              apply: (sub) => sub.addStringOption(o => o.setName('accion').setDescription('AcciÃ³n a aplicar').setRequired(false).addChoices(
                { name: 'timeout', value: 'timeout' },
                { name: 'kick', value: 'kick' },
                { name: 'none', value: 'none' }
              ))
            },
            { apply: (sub) => sub.addStringOption(o => o.setName('timeout').setDescription('DuraciÃ³n (ej: 10m, 1h)').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const windowMs = interaction.options.getInteger('ventana_ms')
            const threshold = interaction.options.getInteger('umbral')
            const action = interaction.options.getString('accion')
            const timeoutStr = interaction.options.getString('timeout')

            if (windowMs !== null && windowMs !== undefined) guildData.antiRaidJoinWindowMs = clamp(windowMs, 2000, 300000)
            if (threshold !== null && threshold !== undefined) guildData.antiRaidJoinThreshold = clamp(threshold, 2, 100)
            if (action) guildData.antiRaidAction = action
            if (timeoutStr) guildData.antiRaidTimeoutMs = parseDuration(timeoutStr, { minMs: 5_000, maxMs: 28 * 24 * 60 * 60_000, label: 'Timeout' })

            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Anti-raid configurado',
              lines: [
                `${Emojis.dot} Ventana: ${Format.inlineCode(`${guildData.antiRaidJoinWindowMs}ms`)}`,
                `${Emojis.dot} Umbral: ${Format.inlineCode(String(guildData.antiRaidJoinThreshold))}`,
                `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(String(guildData.antiRaidAction))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.antiRaidTimeoutMs, { long: true }))}`
              ]
            }, { ephemeral: true })
          }
        },
        {
          name: 'mode',
          description: 'Activa o desactiva raid mode manualmente',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            {
              apply: (sub) => sub.addStringOption(o => o.setName('estado').setDescription('on/off').setRequired(true).addChoices(
                { name: 'on', value: 'on' },
                { name: 'off', value: 'off' }
              ))
            },
            { apply: (sub) => sub.addStringOption(o => o.setName('duracion').setDescription('Solo si on. Ej: 10m').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const state = interaction.options.getString('estado', true)
            const dur = interaction.options.getString('duracion')
            const guildData = await client.db.getGuildData(interaction.guild.id)

            if (state === 'off') {
              guildData.raidModeUntil = 0
              await guildData.save()
              return replyOk(client, interaction, { system: 'security', title: 'Raid mode desactivado', lines: ['Listo.'] }, { ephemeral: true })
            }

            const durationMs = dur
              ? parseDuration(dur, { minMs: 10_000, maxMs: 28 * 24 * 60 * 60_000, label: 'DuraciÃ³n' })
              : clamp(guildData.antiRaidTimeoutMs, 10_000, 28 * 24 * 60 * 60_000)
            guildData.raidModeUntil = Date.now() + durationMs
            await guildData.save()

            return replyOk(client, interaction, {
              system: 'security',
              title: 'Raid mode activado',
              lines: [
                `${Emojis.dot} Hasta: <t:${Math.floor(guildData.raidModeUntil / 1000)}:R>`,
                `${Emojis.dot} AcciÃ³n joiners: ${Format.inlineCode(String(guildData.antiRaidAction || 'timeout'))}`
              ]
            }, { ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'nuke',
      description: 'Anti-nuke (canales/roles/bans)',
      subcommands: [
        {
          name: 'enable',
          description: 'Activa/desactiva anti-nuke',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('true=on / false=off').setRequired(true)) }
          ],
          handler: async (client, interaction) => {
            const active = Boolean(interaction.options.getBoolean('activo', true))
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.antiNukeEnabled = active
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Anti-nuke actualizado',
              lines: [`${Emojis.dot} Estado: ${active ? `${Emojis.success} on` : `${Emojis.error} off`}`]
            }, { ephemeral: true })
          }
        },
        {
          name: 'config',
          description: 'Ajusta ventana/umbral/castigo',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addIntegerOption(o => o.setName('ventana_ms').setDescription('Ventana de detecciÃ³n (ms)').setRequired(false).setMinValue(2000).setMaxValue(300000)) },
            { apply: (sub) => sub.addIntegerOption(o => o.setName('umbral').setDescription('Eventos en ventana').setRequired(false).setMinValue(2).setMaxValue(50)) },
            {
              apply: (sub) => sub.addStringOption(o => o.setName('castigo').setDescription('AcciÃ³n al detectar').setRequired(false).addChoices(
                { name: 'timeout', value: 'timeout' },
                { name: 'ban', value: 'ban' },
                { name: 'none', value: 'none' }
              ))
            },
            { apply: (sub) => sub.addStringOption(o => o.setName('timeout').setDescription('DuraciÃ³n (si timeout). Ej: 1d').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const windowMs = interaction.options.getInteger('ventana_ms')
            const threshold = interaction.options.getInteger('umbral')
            const punishment = interaction.options.getString('castigo')
            const timeoutStr = interaction.options.getString('timeout')

            if (windowMs !== null && windowMs !== undefined) guildData.antiNukeWindowMs = clamp(windowMs, 2000, 300000)
            if (threshold !== null && threshold !== undefined) guildData.antiNukeThreshold = clamp(threshold, 2, 50)
            if (punishment) guildData.antiNukePunishment = punishment
            if (timeoutStr) guildData.antiNukeTimeoutMs = parseDuration(timeoutStr, { minMs: 5_000, maxMs: 28 * 24 * 60 * 60_000, label: 'Timeout' })

            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Anti-nuke configurado',
              lines: [
                `${Emojis.dot} Ventana: ${Format.inlineCode(`${guildData.antiNukeWindowMs}ms`)}`,
                `${Emojis.dot} Umbral: ${Format.inlineCode(String(guildData.antiNukeThreshold))}`,
                `${Emojis.dot} Castigo: ${Format.inlineCode(String(guildData.antiNukePunishment))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.antiNukeTimeoutMs, { long: true }))}`
              ],
              signature: 'Incluye: channelDelete, roleDelete, guildBanAdd'
            }, { ephemeral: true })
          }
        },
        {
          name: 'whitelist-add',
          description: 'Agrega usuario o rol a la whitelist',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) },
            { apply: (sub) => sub.addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('usuario')
            const role = interaction.options.getRole('rol')
            if (!user && !role) throw new Error('Debes indicar usuario o rol.')

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const users = new Set(ensureArray(guildData.securityWhitelistUsers).map(String))
            const roles = new Set(ensureArray(guildData.securityWhitelistRoles).map(String))
            if (user) users.add(user.id)
            if (role) roles.add(role.id)
            guildData.securityWhitelistUsers = Array.from(users)
            guildData.securityWhitelistRoles = Array.from(roles)
            await guildData.save()

            return replyOk(client, interaction, {
              system: 'security',
              title: 'Whitelist actualizada',
              lines: [
                user ? `${Emojis.dot} Usuario: ${user} (${Format.inlineCode(user.id)})` : null,
                role ? `${Emojis.dot} Rol: ${role} (${Format.inlineCode(role.id)})` : null,
                `${Emojis.dot} Totales: users=${Format.inlineCode(String(guildData.securityWhitelistUsers.length))} roles=${Format.inlineCode(String(guildData.securityWhitelistRoles.length))}`
              ].filter(Boolean)
            }, { ephemeral: true })
          }
        },
        {
          name: 'whitelist-remove',
          description: 'Quita usuario o rol de la whitelist',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(false)) },
            { apply: (sub) => sub.addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const user = interaction.options.getUser('usuario')
            const role = interaction.options.getRole('rol')
            if (!user && !role) throw new Error('Debes indicar usuario o rol.')

            const guildData = await client.db.getGuildData(interaction.guild.id)
            const users = new Set(ensureArray(guildData.securityWhitelistUsers).map(String))
            const roles = new Set(ensureArray(guildData.securityWhitelistRoles).map(String))
            if (user) users.delete(user.id)
            if (role) roles.delete(role.id)
            guildData.securityWhitelistUsers = Array.from(users)
            guildData.securityWhitelistRoles = Array.from(roles)
            await guildData.save()

            return replyOk(client, interaction, {
              system: 'security',
              title: 'Whitelist actualizada',
              lines: [
                user ? `${Emojis.dot} Usuario removido: ${user} (${Format.inlineCode(user.id)})` : null,
                role ? `${Emojis.dot} Rol removido: ${role} (${Format.inlineCode(role.id)})` : null,
                `${Emojis.dot} Totales: users=${Format.inlineCode(String(guildData.securityWhitelistUsers.length))} roles=${Format.inlineCode(String(guildData.securityWhitelistRoles.length))}`
              ].filter(Boolean)
            }, { ephemeral: true })
          }
        },
        {
          name: 'whitelist-list',
          description: 'Lista whitelist',
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.SECURITY_VIEW] },
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const users = ensureArray(guildData.securityWhitelistUsers).map(id => `<@${id}>`).join(', ') || Format.italic('vacÃ­a')
            const roles = ensureArray(guildData.securityWhitelistRoles).map(id => `<@&${id}>`).join(', ') || Format.italic('vacÃ­a')
            return replyInfo(client, interaction, {
              system: 'security',
              title: 'Whitelist',
              lines: [
                `${Emojis.dot} Users: ${users}`,
                `${Emojis.dot} Roles: ${roles}`
              ]
            }, { ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'alt',
      description: 'DetecciÃ³n de cuentas nuevas (alts)',
      subcommands: [
        {
          name: 'enable',
          description: 'Activa/desactiva alt detection',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('true=on / false=off').setRequired(true)) }
          ],
          handler: async (client, interaction) => {
            const active = Boolean(interaction.options.getBoolean('activo', true))
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.altDetectionEnabled = active
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Alt detection actualizado',
              lines: [`${Emojis.dot} Estado: ${active ? `${Emojis.success} on` : `${Emojis.error} off`}`]
            }, { ephemeral: true })
          }
        },
        {
          name: 'config',
          description: 'Ajusta edad mÃ­nima y acciÃ³n',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addStringOption(o => o.setName('edad_min').setDescription('Ej: 3d, 12h').setRequired(false)) },
            {
              apply: (sub) => sub.addStringOption(o => o.setName('accion').setDescription('AcciÃ³n').setRequired(false).addChoices(
                { name: 'timeout', value: 'timeout' },
                { name: 'kick', value: 'kick' },
                { name: 'none', value: 'none' }
              ))
            },
            { apply: (sub) => sub.addStringOption(o => o.setName('timeout').setDescription('DuraciÃ³n (si timeout). Ej: 30m').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const ageStr = interaction.options.getString('edad_min')
            const action = interaction.options.getString('accion')
            const timeoutStr = interaction.options.getString('timeout')

            if (ageStr) guildData.altMinAccountAgeMs = parseDuration(ageStr, { minMs: 0, maxMs: 365 * 24 * 60 * 60_000, label: 'Edad mÃ­nima' })
            if (action) guildData.altAction = action
            if (timeoutStr) guildData.altTimeoutMs = parseDuration(timeoutStr, { minMs: 5_000, maxMs: 28 * 24 * 60 * 60_000, label: 'Timeout' })

            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Alt detection configurado',
              lines: [
                `${Emojis.dot} Edad mÃ­n: ${Format.inlineCode(ms(guildData.altMinAccountAgeMs, { long: true }))}`,
                `${Emojis.dot} AcciÃ³n: ${Format.inlineCode(String(guildData.altAction))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.altTimeoutMs, { long: true }))}`
              ]
            }, { ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'automod',
      description: 'AutoMod (mensajes): invites/mentions/badwords',
      subcommands: [
        {
          name: 'enable',
          description: 'Activa/desactiva AutoMod',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('activo').setDescription('true=on / false=off').setRequired(true)) }
          ],
          handler: async (client, interaction) => {
            const active = Boolean(interaction.options.getBoolean('activo', true))
            const guildData = await client.db.getGuildData(interaction.guild.id)
            guildData.automodEnabled = active
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'AutoMod actualizado',
              lines: [`${Emojis.dot} Estado: ${active ? `${Emojis.success} on` : `${Emojis.error} off`}`],
              signature: `Config: ${Format.inlineCode('/security automod config')}`
            }, { ephemeral: true })
          }
        },
        {
          name: 'config',
          description: 'Configura reglas y acción',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addBooleanOption(o => o.setName('bloquear_invites').setDescription('Bloquea links discord.gg/invite').setRequired(false)) },
            { apply: (sub) => sub.addIntegerOption(o => o.setName('max_menciones').setDescription('Máx menciones permitidas').setRequired(false).setMinValue(1).setMaxValue(50)) },
            {
              apply: (sub) => sub.addStringOption(o => o.setName('accion').setDescription('Acción').setRequired(false).addChoices(
                { name: 'delete', value: 'delete' },
                { name: 'warn', value: 'warn' },
                { name: 'timeout', value: 'timeout' }
              ))
            },
            { apply: (sub) => sub.addStringOption(o => o.setName('timeout').setDescription('Duración (si timeout). Ej: 10m').setRequired(false)) }
          ],
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const blockInvites = interaction.options.getBoolean('bloquear_invites')
            const maxMentions = interaction.options.getInteger('max_menciones')
            const action = interaction.options.getString('accion')
            const timeoutStr = interaction.options.getString('timeout')

            if (blockInvites !== null && blockInvites !== undefined) guildData.automodBlockInvites = Boolean(blockInvites)
            if (maxMentions !== null && maxMentions !== undefined) guildData.automodMaxMentions = clamp(maxMentions, 1, 50)
            if (action) guildData.automodAction = action
            if (timeoutStr) guildData.automodTimeoutMs = parseDuration(timeoutStr, { minMs: 5_000, maxMs: 28 * 24 * 60 * 60_000, label: 'Timeout' })

            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'AutoMod configurado',
              lines: [
                `${Emojis.dot} Invites: ${guildData.automodBlockInvites ? `${Emojis.success} block` : `${Emojis.error} allow`}`,
                `${Emojis.dot} Máx menciones: ${Format.inlineCode(String(guildData.automodMaxMentions))}`,
                `${Emojis.dot} Acción: ${Format.inlineCode(String(guildData.automodAction))}`,
                `${Emojis.dot} Timeout: ${Format.inlineCode(ms(guildData.automodTimeoutMs || 0, { long: true }))}`,
                `${Emojis.dot} Badwords: ${Format.inlineCode(String((guildData.automodBadWords || []).length))}`
              ]
            }, { ephemeral: true })
          }
        },
        {
          name: 'badword-add',
          description: 'Agrega una palabra al filtro',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addStringOption(o => o.setName('palabra').setDescription('Texto a filtrar').setRequired(true).setMaxLength(40)) }
          ],
          handler: async (client, interaction) => {
            const word = String(interaction.options.getString('palabra', true)).trim().toLowerCase()
            if (!word) throw new Error('Palabra inválida.')
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const list = Array.isArray(guildData.automodBadWords) ? guildData.automodBadWords : []
            if (!list.includes(word)) list.push(word)
            guildData.automodBadWords = list.slice(0, 200)
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Filtro actualizado',
              lines: [
                `${Emojis.dot} Añadida: ${Format.inlineCode(word)}`,
                `${Emojis.dot} Total: ${Format.inlineCode(String(guildData.automodBadWords.length))}`
              ]
            }, { ephemeral: true })
          }
        },
        {
          name: 'badword-remove',
          description: 'Quita una palabra del filtro',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addStringOption(o => o.setName('palabra').setDescription('Texto').setRequired(true).setMaxLength(40)) }
          ],
          handler: async (client, interaction) => {
            const word = String(interaction.options.getString('palabra', true)).trim().toLowerCase()
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const list = Array.isArray(guildData.automodBadWords) ? guildData.automodBadWords : []
            const next = list.filter(w => String(w).toLowerCase() !== word)
            guildData.automodBadWords = next
            await guildData.save()
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Filtro actualizado',
              lines: [
                `${Emojis.dot} Removida: ${Format.inlineCode(word)}`,
                `${Emojis.dot} Total: ${Format.inlineCode(String(next.length))}`
              ]
            }, { ephemeral: true })
          }
        },
        {
          name: 'badword-list',
          description: 'Muestra palabras filtradas',
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.SECURITY_VIEW] },
          handler: async (client, interaction) => {
            const guildData = await client.db.getGuildData(interaction.guild.id)
            const list = Array.isArray(guildData.automodBadWords) ? guildData.automodBadWords : []
            if (!list.length) {
              return replyWarn(client, interaction, { system: 'security', title: 'Sin palabras', lines: ['El filtro está vacío.'] }, { ephemeral: true })
            }
            const shown = list.slice(0, 30).map(w => Format.inlineCode(String(w))).join(', ')
            return replyInfo(client, interaction, {
              system: 'security',
              title: 'Badwords',
              lines: [
                `${Emojis.dot} Total: ${Format.inlineCode(String(list.length))}`,
                `${Emojis.dot} Muestra: ${shown}`
              ]
            }, { ephemeral: true })
          }
        }
      ]
    },
    {
      name: 'incidents',
      description: 'Incidentes de seguridad',
      subcommands: [
        {
          name: 'latest',
          description: 'Muestra los Ãºltimos incidentes',
          auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.SECURITY_VIEW] },
          options: [
            { apply: (sub) => sub.addIntegerOption(o => o.setName('limite').setDescription('1-20').setRequired(false).setMinValue(1).setMaxValue(20)) }
          ],
          handler: async (client, interaction) => {
            const limit = interaction.options.getInteger('limite') || 10
            const rows = await Systems.security.listIncidents({ guildID: interaction.guild.id, limit })
            if (!rows.length) {
              return replyWarn(client, interaction, {
                system: 'security',
                title: 'Sin incidentes',
                lines: ['No hay incidentes registrados.']
              }, { ephemeral: true })
            }

            const lines = rows.map((r) => {
              const ts = `<t:${Math.floor(new Date(r.createdAt).getTime() / 1000)}:R>`
              const resolved = r.resolvedAt ? `${Emojis.success} resuelto` : `${Emojis.warn} abierto`
              const actor = r.actorID ? `<@${r.actorID}>` : Format.inlineCode('n/a')
              return `${Emojis.dot} ${Format.bold(r.type)} ${Format.inlineCode(r.severity)} ${ts} â€” ${resolved}\n${Emojis.dot} Actor: ${actor}\n${Emojis.dot} ID: ${Format.inlineCode(String(r._id))}`
            })

            return replyEmbed(client, interaction, {
              system: 'security',
              kind: 'info',
              title: `${Emojis.security} Incidentes`,
              description: [headerLine(Emojis.security, 'Ãšltimos'), lines.join('\n\n')].join('\n'),
              signature: `Resolver: ${Format.inlineCode('/security incidents resolve')} ${Emojis.dot} Ver estado: ${Format.inlineCode('/security status')}`
            }, { ephemeral: true })
          }
        },
        {
          name: 'resolve',
          description: 'Marca un incidente como resuelto',
          auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.SECURITY_MANAGE] },
          options: [
            { apply: (sub) => sub.addStringOption(o => o.setName('id').setDescription('ID del incidente (Mongo)').setRequired(true).setMinLength(10).setMaxLength(64)) }
          ],
          handler: async (client, interaction) => {
            const id = interaction.options.getString('id', true)
            const doc = await Systems.security.resolveIncident({ guildID: interaction.guild.id, incidentId: id })
            return replyOk(client, interaction, {
              system: 'security',
              title: 'Incidente resuelto',
              lines: [
                `${Emojis.dot} Tipo: ${Format.inlineCode(doc.type)}`,
                `${Emojis.dot} ID: ${Format.inlineCode(String(doc._id))}`,
                `${Emojis.dot} Resuelto: <t:${Math.floor(new Date(doc.resolvedAt).getTime() / 1000)}:R>`
              ]
            }, { ephemeral: true })
          }
        }
      ]
    }
  ]
})
