const DEFAULT_FEED_MESSAGE = '**{videoAuthorName}** uploaded `{videoTitle}`!\n**Watch it:** {videoURL}'
function feedMessage(settings, guildId, platform, creator, fallback) {
  const records = settings.get(guildId, `${platform}.templates`)
  const entry = (Array.isArray(records) ? records : []).find(entry => entry?.creator === creator)
  return typeof entry?.message === 'string' ? entry.message : typeof fallback === 'string' ? fallback : DEFAULT_FEED_MESSAGE
}
const validDiscordId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
module.exports = { feedMessage, DEFAULT_FEED_MESSAGE, validDiscordId }
