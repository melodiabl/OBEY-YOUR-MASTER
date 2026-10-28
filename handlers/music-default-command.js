const { changeMusicDefault, equalizerProfiles } = require('./music-default-settings')
const { localeFor, t } = require('./i18n')
const { setupFailureNotice } = require('./setup-errors')
async function runMusicDefaultCommand(client, message, args, field) {
  const locale = localeFor(client, message.guild?.id)
  const notice = (key, variables) => ({ content: t(locale, 'musicDefaults.' + key, variables), allowedMentions: { parse: [], repliedUser: false } })
  let reply
  try {
    let value
    if (field === 'volume' && args?.length === 1 && /^\d{1,3}$/.test(args[0])) value = Number(args[0])
    if (field === 'equalizer' && args?.length === 1) value = args[0].toLowerCase()
    if ((field === 'volume' && (value === undefined || value < 1 || value > 150)) || (field === 'autoplay' && args?.length) ||
        (field === 'equalizer' && (args?.length > 1 || (value !== undefined && !Object.hasOwn(equalizerProfiles, value))))) throw Object.assign(new Error('invalid_setup'), { code: 'invalid_setup' })
    const saved = await changeMusicDefault(client, { guildId: message.guild?.id, channelId: message.channel?.id,
      actorId: message.author?.id, transport: 'prefix' }, field, value)
    if (field === 'volume') reply = notice('volumeSaved', { volume: saved.values.volume })
    else if (field === 'equalizer') reply = notice('equalizerSaved', { preset: saved.values.equalizer })
    else reply = notice(saved.values.autoplay ? 'autoplayOn' : 'autoplayOff')
  } catch (error) {
    const key = error.code === 'invalid_setup' ? field + 'Invalid' : error.code === 'setup_conflict' ? 'conflict' : 'unavailable'
    reply = setupFailureNotice(locale, error, notice(key), 'music-defaults/command')
  }
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}
module.exports = { runMusicDefaultCommand }
