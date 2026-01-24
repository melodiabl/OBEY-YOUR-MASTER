const ms = require('ms')
const { createSystemSlashCommand } = require('../../core/commands/createSystemSlashCommand')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { parsePolicy } = require('../../systems').moderation
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

function ensureMap (v) {
  if (!v) return new Map()
  if (typeof v.get === 'function') return v
  return new Map(Object.entries(v))
}

function parseDuration (value) {
  const raw = String(value || '').trim()
  const parsed = ms(raw)
  if (!parsed || !Number.isFinite(parsed)) throw new Error('Duración inválida.')
  return Math.max(5_000, Math.min(28 * 24 * 60 * 60_000, parsed))
}

module.exports = createSystemSlashCommand({
  name: 'warn-policy',
  description: 'Configura acciones progresivas por warns (auto-timeout/kick/ban)',
  moduleKey: 'moderation',
  subcommands: [
    {
      name: 'list',
      description: 'Muestra la política actual',
      auth: { role: INTERNAL_ROLES.MOD, perms: [PERMS.MOD_MANAGE] },
      handler: async (client, interaction) => {
        const gd = await client.db.getGuildData(interaction.guild.id)
        const policy = parsePolicy(gd)
        const lines = policy.map(p => {
          const extra = p.action === 'timeout' ? ` ${Format.subtext(ms(p.durationMs || 0, { long: true }))}` : ''
          return `${Emojis.dot} Warn #${Format.inlineCode(String(p.threshold))} → ${Format.inlineCode(p.action)}${extra}`
        })
        return replyEmbed(client, interaction, {
          system: 'moderation',
          kind: 'info',
          title: `${Emojis.moderation} Warn policy`,
          description: [headerLine(Emojis.moderation, 'Progresiva'), lines.join('\n')].join('\n'),
          signature: `Editar: ${Format.inlineCode('/warn-policy set')} ${Emojis.dot} Reset: ${Format.inlineCode('/warn-policy reset')}`
        }, { ephemeral: true })
      }
    },
    {
      name: 'set',
      description: 'Define una acción al llegar a N warns',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.MOD_MANAGE] },
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('warns').setDescription('Número de warns').setRequired(true).setMinValue(1).setMaxValue(20))
        },
        {
          apply: (sub) => sub.addStringOption(o => o.setName('accion').setDescription('Acción').setRequired(true).addChoices(
            { name: 'timeout', value: 'timeout' },
            { name: 'kick', value: 'kick' },
            { name: 'ban', value: 'ban' }
          ))
        },
        {
          apply: (sub) => sub.addStringOption(o => o.setName('duracion').setDescription('Solo si timeout. Ej: 10m, 1h').setRequired(false))
        }
      ],
      handler: async (client, interaction) => {
        const warns = interaction.options.getInteger('warns', true)
        const action = interaction.options.getString('accion', true)
        const durationStr = interaction.options.getString('duracion')

        const gd = await client.db.getGuildData(interaction.guild.id)
        const map = ensureMap(gd.warnPolicy)
        const entry = { action }
        if (action === 'timeout') entry.durationMs = durationStr ? parseDuration(durationStr) : 10 * 60_000
        map.set(String(warns), entry)
        gd.warnPolicy = map
        await gd.save()

        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Warn policy actualizada',
          lines: [
            `${Emojis.dot} Warn #: ${Format.inlineCode(String(warns))}`,
            `${Emojis.dot} Acción: ${Format.inlineCode(action)}`,
            action === 'timeout' ? `${Emojis.dot} Duración: ${Format.inlineCode(ms(entry.durationMs, { long: true }))}` : null
          ].filter(Boolean)
        }, { ephemeral: true })
      }
    },
    {
      name: 'remove',
      description: 'Elimina la regla de un número de warns',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.MOD_MANAGE] },
      options: [
        {
          apply: (sub) => sub.addIntegerOption(o => o.setName('warns').setDescription('Número de warns').setRequired(true).setMinValue(1).setMaxValue(20))
        }
      ],
      handler: async (client, interaction) => {
        const warns = interaction.options.getInteger('warns', true)
        const gd = await client.db.getGuildData(interaction.guild.id)
        const map = ensureMap(gd.warnPolicy)
        const existed = map.delete(String(warns))
        gd.warnPolicy = map
        await gd.save()

        if (!existed) {
          return replyWarn(client, interaction, { system: 'moderation', title: 'Sin cambios', lines: ['No existía una regla para ese número.'] }, { ephemeral: true })
        }

        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Regla removida',
          lines: [`${Emojis.dot} Warn #: ${Format.inlineCode(String(warns))}`]
        }, { ephemeral: true })
      }
    },
    {
      name: 'reset',
      description: 'Resetea la política (vuelve al default)',
      auth: { role: INTERNAL_ROLES.ADMIN, perms: [PERMS.MOD_MANAGE] },
      handler: async (client, interaction) => {
        const gd = await client.db.getGuildData(interaction.guild.id)
        gd.warnPolicy = new Map()
        await gd.save()
        return replyOk(client, interaction, {
          system: 'moderation',
          title: 'Warn policy reseteada',
          lines: ['Default: warn #3 → kick']
        }, { ephemeral: true })
      }
    }
  ]
})
