const { cardMedia } = require('./card-media')
const drawNoise = (...args) => require('./card-renderer').drawNoise(...args)
const drawCircularAvatar = (...args) => require('./card-renderer').drawCircularAvatar(...args)
const fitCardText = (...args) => require('./card-renderer').fitCardText(...args)
const renderWelcomeCard = (...args) => require('./card-renderer').renderWelcomeCard(...args)
const renderLeaveCard = (...args) => require('./card-renderer').renderLeaveCard(...args)

function projectedCardData(member) {
  return { username: member.user.username, discriminator: member.user.discriminator,
    guildName: member.guild.name, memberCount: member.guild.memberCount }
}
async function renderConfiguredMembershipCard(settings, member, kind, { dm = false, media = cardMedia } = {}) {
  const get = key => settings.get(member.guild.id, `${kind}.${key}${dm ? 'dm' : ''}`)
  const rawColor = get('framecolor')
  const frameColor = typeof rawColor === 'string' ? rawColor : '#3A98F0'
  const accentColor = /^(#[0-9a-f]{6}|white)$/i.test(frameColor) ? frameColor.replace(/^white$/i, '#FFFFF9') : '#5865F2'
  const options = { data: projectedCardData(member), accentColor,
    frameColor: kind === 'welcome' && get('frame') !== false ? frameColor : null,
    showAvatar: kind === 'welcome' ? get('pb') !== false : Boolean(get('pb')),
    showDiscriminator: Boolean(get('discriminator')), showMemberCount: Boolean(get('membercount')),
    showServerName: Boolean(get('servername')), isLeave: kind === 'leave' }
  const background = get('background')
  const [avatarBuffer, backgroundBuffer] = await Promise.all([
    options.showAvatar ? media.optional(member.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true })) : null,
    media.optional(background),
  ])
  return (kind === 'welcome' ? renderWelcomeCard : renderLeaveCard)({ ...options, avatarBuffer, backgroundBuffer })
}
const renderConfiguredWelcomeCard = (settings, member, options) => renderConfiguredMembershipCard(settings, member, 'welcome', options)
const renderConfiguredLeaveCard = (settings, member, options) => renderConfiguredMembershipCard(settings, member, 'leave', options)

module.exports = { drawNoise, drawCircularAvatar, fitCardText, renderLeaveCard, renderWelcomeCard, renderConfiguredWelcomeCard, renderConfiguredLeaveCard }
