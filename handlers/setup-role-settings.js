const { z } = require('zod')
const { openFormSetup, checkResources } = require('./setup-form')
const { label, snowflake, ids, field, channel } = require('./setup-fields')
const { buildCommandCatalog } = require('./command-registry')
const threshold = path => field(path, 'threshold', false, z.union([z.literal(false), z.number().int().positive().max(1000000)]), path.endsWith('kick') ? 'Avisos para expulsar' : 'Avisos para banear', path.endsWith('kick') ? 'Warnings before kick' : 'Warnings before ban', {
  clear: false, hint: label('Número de avisos. Vaciar desactiva esta sanción; se aplica al guardar.', 'Number of warnings. Clear disables this action after saving.'),
  parse: input => /^\d+$/.test(input.trim()) ? Number(input.trim()) : undefined,
})
const ruleField = (path, fallback, ranking) => field(path, 'rules', fallback,
  ranking ? z.record(z.string().regex(/^\d+$/), snowflake) : z.array(z.object({ warncount: z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]), roleid: snowflake }).passthrough()).max(1000),
  ranking ? 'Roles por nivel' : 'Roles por avisos', ranking ? 'Level roles' : 'Warning roles', {
    removable: true, clear: fallback,
    hint: label('Añadir: número e ID del rol por línea, por ejemplo 3 12345678901234567. Quitar: solo el número. Guardar aplica las reglas.', 'Add: number and role ID per line, e.g. 3 12345678901234567. Remove: only the number. Save applies the rules.'),
    format: value => ranking ? Object.entries(value || {}).map(([n, role]) => `${n}: ${role}`).join('\n') : (value || []).map(rule => `${rule.warncount}: ${rule.roleid}`).join('\n'),
    parse(input, previous, removing) {
      let rules = structuredClone(previous || fallback)
      for (const line of input.trim().split(/\r?\n/)) {
        const match = /^(\d+)(?:\s+(?:<@&)?(\d{17,20})>?)?$/.exec(line.trim())
        if (!match || !Number.isSafeInteger(Number(match[1])) || Number(match[1]) < (ranking ? 0 : 1) || (!removing && !match[2])) return undefined
        const number = Number(match[1])
        if (ranking) { if (removing) delete rules[number]; else rules[number] = match[2] }
        else { rules = rules.filter(rule => Number(rule.warncount) !== number); if (!removing) rules.push({ warncount: number, roleid: match[2] }) }
      }
      return rules
    },
  })
const warn = { title: label('Avisos y sanciones', 'Warnings and actions'), fields: { kick: threshold('warnsettings.kick'), ban: threshold('warnsettings.ban'), roles: ruleField('warnsettings.roles', [], false) },
  async validate(values, access) { for (const rule of values.roles || []) await checkResources(access, { type: 'role', noAdmin: true }, rule.roleid) } }
const rank = { title: label('Niveles y recompensas', 'Levels and rewards'), store: 'points', fields: {
  disabled: field('disabled', 'boolean', false, z.boolean(), 'Sistema desactivado', 'System disabled'),
  channel: channel('channel', false, 'Canal de anuncios (vacío: canal actual)', 'Announcement channel (empty: current channel)'),
  roles: ruleField('rankroles', {}, true),
}, async validate(values, access) { for (const role of Object.values(values.roles || {})) await checkResources(access, { type: 'role', noAdmin: true }, role) } }
function adminDefinition(client) {
  const commands = buildCommandCatalog(client).filter(command => command.transport === 'prefix' && !command.disabled && !command.category.toLowerCase().includes('owner') && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(command.name))
  return { title: label('Permisos de moderación', 'Moderation permissions'), fields: {
    general: field('adminroles', 'roles', [], ids, 'Roles generales', 'General roles', { clear: [], permissionOnly: true }),
    ...Object.fromEntries(commands.map(command => [`cmd_${command.name}`, field(`cmdadminroles.${command.name}`, 'principals', [], ids, command.name, command.name, { clear: [] })])),
  } }
}
function openRoleSettings(client, message, id) {
  const definition = id === 'admin' ? adminDefinition(client) : id === 'warn' ? warn : id === 'rank' ? rank : null
  if (!definition) throw new Error('invalid_setup_definition')
  return openFormSetup(client, message, definition)
}
module.exports = { openRoleSettings, warn, rank, adminDefinition }
