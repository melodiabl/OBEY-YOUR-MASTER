// Retired adult/profane commands must not return under an ordinary category.
const RETIRED_NAMES = new Set(['brazzers', 'shit'])
const COMMAND_CATEGORY_KEYS = Object.freeze(['ECONOMY', 'SCHOOL', 'MUSIC', 'FILTER', 'CUSTOMQUEUE', 'PROGRAMMING', 'RANKING', 'SOUNDBOARD', 'VOICE', 'FUN', 'MINIGAMES', 'ANIME'])
function commandCategoryKey(category) {
  if (typeof category !== 'string') return null
  const normalized = category.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const key = ({ ANIMEEMOTIONS: 'ANIME', SCHOOLCOMMANDS: 'SCHOOL' })[normalized] || normalized
  return COMMAND_CATEGORY_KEYS.includes(key) ? key : null
}
function commandCategoryEnabled(settings, category) {
  const key = commandCategoryKey(category)
  return !key || settings?.[key] !== false
}
function isRestrictedCommand(command, category = '') {
  return command?.nsfw === true || typeof command?.name === 'string' && RETIRED_NAMES.has(command.name.toLowerCase()) ||
    [category, command?.category, command?.name].some(value => typeof value === 'string' && /nsfw/i.test(value))
}
module.exports = { isRestrictedCommand, COMMAND_CATEGORY_KEYS, commandCategoryKey, commandCategoryEnabled }
