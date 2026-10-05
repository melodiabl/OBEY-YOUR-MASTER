const themes = [['midnight', 'Midnight', 0x64748b, '🌙'], ['minimal', 'Minimal', 0x94a3b8, ''], ['sakura', 'Sakura', 0xf9a8d4, '🌸'],
  ['nebula', 'Nebula', 0xa78bfa, '✨'], ['gaming', 'Gaming', 0x22c55e, '🎮'], ['luxury', 'Luxury', 0xd4af37, '◆'], ['obey', 'OBEY', 0xd6b567, '✦']]
const themeCatalog = () => themes.map(([id, label]) => ({ id, label }))
const getTheme = id => themes.find(theme => theme[0] === id)
function themedName(name, theme, density, category) {
  return theme[3] && (density === 'expressive' || (category && density === 'subtle')) ? `${theme[3]}・${name}` : name
}
function undecoratedName(name) {
  const prefixes = themes.filter(theme => theme[3]).map(theme => `${theme[3]}・`)
  let prefix
  while ((prefix = prefixes.find(prefix => name.startsWith(prefix)))) name = name.slice(prefix.length)
  return name
}
module.exports = { themeCatalog, getTheme, themedName, undecoratedName }
