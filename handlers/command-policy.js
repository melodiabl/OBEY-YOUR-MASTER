// Retired adult/profane commands must not return under an ordinary category.
const RETIRED_NAMES = new Set(['brazzers', 'shit'])
function isRestrictedCommand(command, category = '') {
  return command?.nsfw === true || typeof command?.name === 'string' && RETIRED_NAMES.has(command.name.toLowerCase()) ||
    [category, command?.category, command?.name].some(value => typeof value === 'string' && /nsfw/i.test(value))
}
module.exports = { isRestrictedCommand }
