const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

function ensureMap (v) {
  if (!v) return new Map()
  if (typeof v.get === 'function') return v
  return new Map(Object.entries(v))
}

function splitPerms (raw) {
  if (!raw) return []
  return String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function roleChoices () {
  return INTERNAL_ROLE_ORDER
    .filter(r => r !== INTERNAL_ROLES.OWNER)
    .map(r => ({ name: r, value: r }))
}

function getField (v, k) {
  if (!v) return undefined
  if (typeof v.get === 'function') return v.get(k)
  return v[k]
}

module.exports = createSystemSlashCommand({
  name: 'overrides',
  description: 'Overrides por comando (cooldown/visibilidad/permisos)',
  moduleKey: 'config',
  subcommands: [
    {
      name: 'list',
      description: 'Lista overrides activos',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const map = ensureMap(guildData.commandOverrides)

        const rows = []
        for (const [k, v] of map.entries()) {
          const enabled = getField(v, 'enabled') === false ? '❌ off' : '✅ on'
          const cooldownMs = Number(getField(v, 'cooldownMs') || 0)
          const visibility = getField(v, 'visibility')
          const role = getField(v, 'role')
          rows.push(`${Emojis.dot} ${Format.inlineCode(k)} → ${enabled}${cooldownMs ? ` • cd=${Format.inlineCode(String(Math.round(cooldownMs / 1000)) + 's')}` : ''}${visibility ? ` • vis=${Format.inlineCode(String(visibility))}` : ''}${role ? ` • role=${Format.inlineCode(String(role))}` : ''}`)
        }

        const e = embed({
          ui,
          system: 'config',
          kind: 'info',
          title: `${Emojis.system} Overrides`,
          description: [
            headerLine(Emojis.system, 'Activos'),
            rows.join('\n') || '*Sin overrides configurados.*'
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'set',
      description: 'Crea o actualiza un override',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('clave').setDescription('Ej: "ban" o "auth role set" o "auth role.set"').setRequired(true).setMaxLength(80)) },
        { apply: (sub) => sub.addBooleanOption(o => o.setName('enabled').setDescription('Habilitar/deshabilitar').setRequired(false)) },
        {
          apply: (sub) => sub.addStringOption(o => o.setName('visibility').setDescription('Visibilidad').setRequired(false).addChoices(
            { name: 'default', value: 'default' },
            { name: 'public', value: 'public' },
            { name: 'ephemeral', value: 'ephemeral' }
          ))
        },
        { apply: (sub) => sub.addIntegerOption(o => o.setName('cooldown_s').setDescription('Cooldown en segundos').setRequired(false).setMinValue(0).setMaxValue(3600)) },
        { apply: (sub) => sub.addStringOption(o => o.setName('role').setDescription('Rol interno mínimo').setRequired(false).addChoices(...roleChoices())) },
        { apply: (sub) => sub.addStringOption(o => o.setName('perms').setDescription('Permisos internos (comma-separated)').setRequired(false).setMaxLength(200)) }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction, { identity }) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)

        const key = String(interaction.options.getString('clave', true)).trim()
        if (!key) return interaction.reply({ content: `${Emojis.error} Clave inválida.`, ephemeral: true })

        const enabled = interaction.options.getBoolean('enabled')
        const visibility = interaction.options.getString('visibility')
        const cooldownS = interaction.options.getInteger('cooldown_s')
        const role = interaction.options.getString('role')
        const perms = interaction.options.getString('perms')

        if (role && (!isValidInternalRole(role) || role === INTERNAL_ROLES.OWNER)) {
          return interaction.reply({ content: `${Emojis.error} Rol inválido.`, ephemeral: true })
        }
        if (role === INTERNAL_ROLES.CREATOR && ![INTERNAL_ROLES.OWNER, INTERNAL_ROLES.CREATOR].includes(identity?.role)) {
          return interaction.reply({ content: `${Emojis.error} Solo **OWNER/CREATOR** puede exigir rol **CREATOR**.`, ephemeral: true })
        }

        const map = ensureMap(guildData.commandOverrides)
        const current = map.get(key) || {}
        const next = { ...current }

        if (typeof enabled === 'boolean') next.enabled = enabled
        if (visibility && visibility !== 'default') next.visibility = visibility
        if (visibility === 'default') delete next.visibility
        if (typeof cooldownS === 'number') next.cooldownMs = Math.max(0, cooldownS) * 1000
        if (role) next.role = role
        if (perms != null) next.perms = splitPerms(perms)

        map.set(key, next)
        guildData.commandOverrides = map
        await guildData.save()

        const e = embed({
          ui,
          system: 'config',
          kind: 'success',
          title: `${Emojis.system} Override guardado`,
          description: [
            headerLine(Emojis.system, 'Listo'),
            `${Emojis.dot} **Clave:** ${Format.inlineCode(key)}`,
            `${Emojis.dot} **Enabled:** ${Format.inlineCode(String(next.enabled !== false))}`,
            `${Emojis.dot} **Visibility:** ${Format.inlineCode(String(next.visibility || 'default'))}`,
            `${Emojis.dot} **Cooldown:** ${Format.inlineCode(String(Math.round(Number(next.cooldownMs || 0) / 1000)) + 's')}`,
            `${Emojis.dot} **Role:** ${Format.inlineCode(String(next.role || '—'))}`,
            `${Emojis.dot} **Perms:** ${next.perms?.length ? next.perms.map(p => Format.inlineCode(p)).join(', ') : Format.inlineCode('—')}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    },
    {
      name: 'clear',
      description: 'Elimina un override',
      options: [
        { apply: (sub) => sub.addStringOption(o => o.setName('clave').setDescription('Clave exacta').setRequired(true).setMaxLength(80)) }
      ],
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.CONFIG_MANAGE] },
      handler: async (client, interaction) => {
        const ui = await getGuildUiConfig(client, interaction.guild.id)
        const guildData = await client.db.getGuildData(interaction.guild.id)
        const key = String(interaction.options.getString('clave', true)).trim()

        const map = ensureMap(guildData.commandOverrides)
        const existed = map.delete(key)
        guildData.commandOverrides = map
        await guildData.save()

        const e = embed({
          ui,
          system: 'config',
          kind: existed ? 'success' : 'warn',
          title: `${Emojis.system} Override`,
          description: [
            headerLine(Emojis.system, existed ? 'Eliminado' : 'No encontrado'),
            `${Emojis.dot} **Clave:** ${Format.inlineCode(key)}`
          ].join('\n')
        })
        return interaction.reply({ embeds: [e], ephemeral: true })
      }
    }
  ]
})
