const { changeMusicDefault } = require('./music-default-settings')
const { localeFor, t } = require('./i18n')
const { setupFailureNotice } = require('./setup-errors')
async function runMusicDefaultCommand(client, message, args, field) {
  const locale = localeFor(client, message.guild?.id)
  const notice = (key, variables) => ({ content: t(locale, 'musicDefaults.' + key, variables), allowedMentions: { parse: [], repliedUser: false } })
  let reply
  try {
    const value = field === 'volume' && args?.length === 1 && /^\d{1,3}$/.test(args[0]) ? Number(args[0]) : undefined
    if ((field === 'volume' && (value === undefined || value < 1 || value > 150)) || (field === 'autoplay' && args?.length)) throw Object.assign(new Error('invalid_setup'), { code: 'invalid_setup' })
    const saved = await changeMusicDefault(client, { guildId: message.guild?.id, channelId: message.channel?.id,
      actorId: message.author?.id, transport: 'prefix' }, field, value)
    reply = field === 'volume' ? notice('volumeSaved', { volume: saved.values.volume }) : notice(saved.values.autoplay ? 'autoplayOn' : 'autoplayOff')
  } catch (error) {
    const key = error.code === 'invalid_setup' ? field === 'volume' ? 'volumeInvalid' : 'autoplayInvalid' : error.code === 'setup_conflict' ? 'conflict' : 'unavailable'
    reply = setupFailureNotice(locale, error, notice(key), 'music-defaults/command')
  }
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}
module.exports = { runMusicDefaultCommand }
