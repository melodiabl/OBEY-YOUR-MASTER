// Command names always take precedence over aliases. Resolve legacy aliases once.
const PREFERRED_ALIASES = { awayfromkeyboard: 'afk', cmdlog: 'setup-admincmdlog', 'setup-caps': 'setup-anticaps', setupcaps: 'setup-anticaps', givemoney: 'pay', tobank: 'deposit', uinfo: 'userinfo', quickcl: 'instantclose', banhammer: 'ban', tempban: 'ban', ap: 'autoplay', p: 'play', mix: 'playmusicmix', prev: 'playprevious', slow: 'slowmode', pruning: 'togglepruning', toggleplaymsg: 'toggleplaymessage' }
function buildAliases(commands) {
  const aliases = new Map(), conflicts = []
  for (const command of [...commands.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    for (const value of command.aliases || []) {
      const alias = String(value).trim().toLowerCase()
      if (!alias || alias === command.name || commands.has(alias)) continue
      const previous = aliases.get(alias)
      if (previous && previous !== command.name) {
        conflicts.push({ alias, candidates: [previous, command.name] })
        if (PREFERRED_ALIASES[alias] === command.name) aliases.set(alias, command.name)
      } else aliases.set(alias, command.name)
    }
  }
  return { aliases, conflicts }
}
function buildCommandCatalog(client) {
  const entries = []
  const aliases = new Map()
  for (const [alias, name] of client.aliases || []) {
    if (client.commands?.has(alias)) continue
    if (!aliases.has(name)) aliases.set(name, [])
    aliases.get(name).push(alias)
  }
  const categoryName = value => String(value || 'Info').replace(/^[^\p{L}\p{N}]+/u, '').trim() || 'Info'
  function permissionNames(value) {
    if (typeof value === 'string') return [value === 'Administrador' ? 'Administrator' : value]
    try {
      const { PermissionsBitField } = require('discord.js')
      const flags = new PermissionsBitField(value), names = flags.toArray()
      return PermissionsBitField.resolve(names) === flags.bitfield ? names : ['UnknownPermission']
    } catch { return ['UnknownPermission'] }
  }
  function metadata(command, id, transport, invocation, category, options = []) {
    return { id, transport, invocation, name: command.name, category: categoryName(category),
      description: String(command.description || 'Sin descripción').slice(0, 500),
      usage: transport === 'prefix' ? String(command.usage || command.name).slice(0, 800) : invocation + options.map(option => ` ${option.required ? '<' : '['}${option.name}${option.required ? '>' : ']'}`).join(''),
      aliases: transport === 'prefix' ? [...(aliases.get(command.name) || [])].sort() : [],
      permissions: Array.isArray(command.memberpermissions) ? [...new Set(command.memberpermissions.flatMap(permissionNames))] : [],
      parameters: Object.fromEntries(['type', 'check_dj', 'activeplayer', 'previoussong', 'notsamechannel'].filter(key => Object.hasOwn(command.parameters || {}, key)).map(key => [key, command.parameters[key]])),
      cooldownSeconds: Number.isFinite(Number(command.cooldown)) && Number(command.cooldown) > 0 ? Number(command.cooldown) : 1,
      disabled: command.enabled === false || command.disabled === true }
  }
  for (const command of client.commands?.values?.() || []) {
    if (typeof command.run === 'function' && typeof command.name === 'string') {
      const entry = metadata(command, `prefix:${command.name}`, 'prefix', command.name, command.category)
      const key = command.name.toLowerCase()
      entry.disabled ||= client.commands.get(key) !== command && client.commands.get(client.aliases?.get(key)) !== command
      entries.push(entry)
    }
  }
  for (const schema of client.allCommands || []) {
    if (typeof schema.name !== 'string') continue
    function walk(options, path = []) {
      for (const option of options || []) {
        if (option.type === 2) walk(option.options, [...path, option.name])
        else if (option.type === 1) {
          const command = client.slashCommands?.get(schema.name + option.name)
          if (typeof command?.run !== 'function') continue
          const parts = [schema.name, ...path, option.name]
          entries.push(metadata(command, `slash:${parts.join('.')}`, 'slash', '/' + parts.join(' '), command.category || schema.name[0].toUpperCase() + schema.name.slice(1), option.options))
        }
      }
    }
    if (schema.options?.some(option => [1, 2].includes(option.type))) walk(schema.options)
    else {
      const command = client.slashCommands?.get('normal' + schema.name)
      if (typeof command?.run === 'function') entries.push(metadata(command, `slash:${schema.name}`, 'slash', '/' + schema.name, command.category, schema.options))
    }
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id))
}
module.exports = { buildAliases, buildCommandCatalog }
