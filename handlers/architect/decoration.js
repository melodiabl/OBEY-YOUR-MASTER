const { BlueprintError } = require('./blueprint')
const { themeCatalog, getTheme, themedName, undecoratedName } = require('./themes')
function decorationCatalog() {
  return { themes: themeCatalog(), scopes: [{ id: 'resource', label: 'Recurso seleccionado' }, { id: 'category', label: 'Categoría seleccionada y sus canales' },
    { id: 'roles', label: 'Roles del servidor' }, { id: 'server', label: 'Servidor completo' }],
    densities: [{ id: 'none', label: 'Sin decoración' }, { id: 'subtle', label: 'Solo categorías' }, { id: 'expressive', label: 'Categorías, canales y roles' }] }
}
function decorateProposal(input, source, choices) {
  const fail = message => { throw new BlueprintError(message, 'invalid_decoration') }
  if (!choices || typeof choices !== 'object' || Array.isArray(choices) || Object.keys(choices).some(key => !['theme', 'decoration', 'scope', 'kind', 'resourceId'].includes(key))) fail('Invalid decoration choices')
  const theme = getTheme(choices.theme)
  if (!theme || !['none', 'subtle', 'expressive'].includes(choices.decoration) || !['resource', 'category', 'roles', 'server'].includes(choices.scope)) fail('Unsupported decoration choices')
  if (choices.scope === 'resource' && (!['roles', 'channels'].includes(choices.kind) || !input[choices.kind].some(item => item.id === choices.resourceId))) fail('Invalid decoration resource')
  if (choices.scope === 'category' && !input.channels.some(item => item.id === choices.resourceId && item.type === 4)) fail('Invalid decoration category')
  if (choices.scope === 'category' && choices.kind !== undefined) fail('Unexpected decoration kind')
  if (!['resource', 'category'].includes(choices.scope) && (choices.resourceId !== undefined || choices.kind !== undefined)) fail('Unexpected decoration target')
  const blueprint = structuredClone(input), protectedIds = new Set(blueprint.protectedIds || []), skipped = []
  let changed = 0
  for (const kind of ['channels', 'roles']) for (const item of blueprint[kind]) {
    const inScope = choices.scope === 'server' || (choices.scope === 'roles' && kind === 'roles') ||
      (choices.scope === 'resource' && choices.kind === kind && choices.resourceId === item.id) ||
      (choices.scope === 'category' && kind === 'channels' && (choices.resourceId === item.id || choices.resourceId === item.parentId))
    if (!inScope) continue
    const colors = source.roleColors?.[item.id]
    const reason = protectedIds.has(item.id) || (kind === 'channels' && protectedIds.has(item.parentId)) || (kind === 'roles' && (item.managed || item.id === source.guildId)) ? 'protected' :
      kind === 'channels' && ![0, 2, 4].includes(item.type) ? 'channel_type' :
        kind === 'roles' && !item.id.startsWith('local:') && (!colors || colors.secondaryColor != null || colors.tertiaryColor != null) ? 'role_style' : null
    if (reason) { skipped.push({ id: item.id, kind, name: item.name, reason }); continue }
    const name = themedName(undecoratedName(item.name), theme, choices.decoration, item.type === 4)
    if (!name.trim() || name.length > 100) throw new BlueprintError('Decoration exceeds the name limit', 'decoration_name_limit')
    if (item.name !== name || (kind === 'roles' && item.color !== theme[2])) changed++
    item.name = name
    if (kind === 'roles') item.color = theme[2]
  }
  return { blueprint, decoration: { choices: structuredClone(choices), changed, skipped } }
}
module.exports = { decorationCatalog, decorateProposal }
