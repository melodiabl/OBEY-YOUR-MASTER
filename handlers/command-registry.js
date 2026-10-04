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
module.exports = { buildAliases }
