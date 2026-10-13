// This application no longer offers age-restricted commands, in any guild/context.
function isRestrictedCommand(command, category = '') {
  return command?.nsfw === true || [category, command?.category, command?.name].some(value => typeof value === 'string' && /nsfw/i.test(value))
}
module.exports = { isRestrictedCommand }
