const { changeDjRole } = require('./dj-role-settings')
const { localeFor, t } = require('./i18n')
const { setupFailureNotice } = require('./setup-errors')
async function runDjRoleCommand(client, message, args, action) {
  const locale = localeFor(client, message.guild?.id)
  const notice = (key, count = 0) => ({ content: t(locale, 'djRoles.' + key, { count }), allowedMentions: { parse: [], repliedUser: false } })
  let reply
  try {
    const match = String(args?.[0] || '').match(/^(?:<@&(\d{17,20})>|(\d{17,20}))$/)
    const result = await changeDjRole(client, { guildId: message.guild?.id, actorId: message.author?.id,
      channelId: message.channel?.id, transport: 'prefix' }, match?.[1] || match?.[2], action)
    reply = notice(result.status, result.roles.length)
    if (result.roles.length) reply.content += '\n' + result.roles.slice(0, 20).map(id => `<@&${id}>`).join(', ')
    else reply.content += '\n' + t(locale, 'djRoles.empty')
  } catch (error) {
    const code = error.code || error.message
    reply = setupFailureNotice(locale, error, notice(code === 'invalid_dj_role' ? 'invalid' : code === 'setup_conflict' ? 'conflict' : 'unavailable'), 'dj-roles/command')
  }
  try { return await message.reply(reply) } catch { try { return await message.author.send(reply) } catch { return undefined } }
}
module.exports = { runDjRoleCommand }
