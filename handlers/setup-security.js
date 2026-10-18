const { z } = require('zod')
const { openFormSetup } = require('./setup-form')
const label = (es, en) => ({ es, en })
const snowflake = z.string().regex(/^\d{17,20}$/)
const ids = z.array(snowflake).max(1000)
const field = (path, type, fallback, schema, es, en, extra = {}) => ({ path, type, default: fallback, schema, label: label(es, en), ...extra })
const bool = (path, fallback = false) => field(path, 'boolean', fallback, z.boolean(), 'Activado', 'Enabled')
const exceptions = root => field(`${root}.whitelistedchannels`, 'channels', [], ids, 'Canales y categorías excluidos', 'Excluded channels and categories', { clear: [] })
const strikes = path => field(path, 'number', 2, z.number().int().min(0).max(15), 'Reincidencias antes de silenciar (0–15)', 'Violations before mute (0–15)', { hint: label('Máximo permitido en 15 segundos; 0 silencia en la primera infracción.', 'Allowed violations within 15 seconds; 0 mutes on the first violation.') })
const definitions = {}
for (const [id, es, en, limit, fallback] of [
  ['anticaps', 'Mayúsculas', 'Capital letters', 'percent', 75], ['antimention', 'Menciones masivas', 'Mass mentions', 'limit', 5], ['antispam', 'Spam', 'Spam', 'limit', 7],
  ['antidiscord', 'Invitaciones de Discord', 'Discord invites'], ['antilink', 'Enlaces', 'Links'],
]) {
  const fields = { enabled: bool(`${id}.enabled`, Boolean(limit)), ...(limit ? { limit: field(`${id}.${limit}`, 'number', fallback, z.number().int().min(limit === 'percent' ? 0 : 1).max(100), limit === 'percent' ? 'Porcentaje máximo de mayúsculas (0–100)' : 'Cantidad máxima (1–100)', limit === 'percent' ? 'Maximum capital letters percentage (0–100)' : 'Maximum amount (1–100)') } : {}), channels: exceptions(id), strikes: strikes(`${id}.mute_amount`) }
  if (!limit) fields.links = field(`${id}.whitelistedlinks`, 'list', [], z.array(z.string().trim().min(1).max(500)).max(1000), 'Enlaces permitidos', 'Allowed links', { clear: [] })
  definitions[id] = { title: label(`Protección: ${es}`, `Protection: ${en}`), fields }
}
definitions.antinewaccount = { title: label('Edad mínima de las cuentas', 'Minimum account age'), fields: {
  enabled: bool('antinewaccount.enabled'),
  delay: field('antinewaccount.delay', 'duration', 172800000, z.number().int().positive().max(Number.MAX_SAFE_INTEGER), 'Edad mínima', 'Minimum age'),
  action: field('antinewaccount.action', 'enum', 'kick', z.enum(['kick', 'ban']), 'Acción', 'Action', { options: ['kick', 'ban'], labels: { kick: label('Expulsar', 'Kick'), ban: label('Banear', 'Ban') } }),
  message: field('antinewaccount.extra_message', 'text', 'Please do not join back, unless you meet the requirements!', z.string().max(2000), 'Mensaje por privado', 'Direct message', { allowEmpty: true, maxInput: 2000, clear: '' }),
} }
definitions.ghost = { title: label('Detección de menciones eliminadas', 'Deleted mention detection'), fields: {
  channel: field('ghost_ping_detector', 'channel', false, z.union([snowflake, z.literal(false)]), 'Canal de registro', 'Log channel', { clear: false }),
  time: field('ghost_ping_detector_max_time', 'duration', 10000, z.number().int().positive().max(Number.MAX_SAFE_INTEGER), 'Tiempo máximo para detectar la eliminación', 'Maximum time to detect deletion'),
} }
definitions.mute = { title: label('Silencios', 'Mutes'), fields: {
  style: field('mute.style', 'enum', 'timeout', z.enum(['timeout', 'role']), 'Método', 'Method', { options: ['timeout', 'role'], labels: { timeout: label('Aislamiento de Discord', 'Discord timeout'), role: label('Rol de silencio', 'Mute role') } }),
  role: field('mute.roleId', 'role', '', z.union([snowflake, z.literal('')]), 'Rol de silencio', 'Mute role', { clear: '', noAdmin: true }),
  time: field('mute.defaultTime', 'duration', 60000, z.number().int().positive().max(604800000), 'Duración predeterminada (máximo 7 días)', 'Default duration (up to 7 days)'),
}, async validate(values, access) { if (values.style === 'role') { if (!values.role) throw new Error('setup_resource'); const { checkResources } = require('./setup-form'); await checkResources(access, definitions.mute.fields.role, values.role) } } }
definitions.blacklist = { title: label('Palabras bloqueadas', 'Blocked words'), store: 'blacklist', fields: {
  words: field('words', 'list', [], z.array(z.string().trim().min(1).max(500)).max(1000), 'Palabras bloqueadas', 'Blocked words', { clear: [] }),
  channels: field('whitelistedchannels', 'channels', [], ids, 'Canales y categorías excluidos', 'Excluded channels and categories', { clear: [] }), strikes: strikes('mute_amount'),
} }
function openSecuritySetup(client, message, id) {
  if (!Object.hasOwn(definitions, id)) throw new Error('invalid_setup_definition')
  return openFormSetup(client, message, definitions[id])
}
module.exports = { openSecuritySetup, definitions }
