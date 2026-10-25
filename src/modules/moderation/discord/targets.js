const { validId } = require('../domain/warnings')
const { HistoryError } = require('../application/history')

function targetFor(message, args) {
  if (!args[0]) return message.author.id
  const mention = /^<@!?(\d{17,20})>$/.exec(args[0])
  if (mention) return mention[1]
  if (validId(args[0])) return args[0]
  const name = String(args[0]).toLowerCase()
  const members = [...message.guild.members.cache.values()]
  const exact = members.filter(member => member.user?.username?.toLowerCase() === name)
  const matches = exact.length ? exact : members.filter(member => member.user?.username?.toLowerCase().includes(name))
  if (matches.length !== 1 || !validId(matches[0].id)) throw new HistoryError('invalidTarget')
  return matches[0].id
}
module.exports = { targetFor }
