const { cardMedia } = require('./card-media')
const { cardPool } = require('./card-pool')
const { cardAssetsFor } = require('./card-assets')
const drawNoise = (...args) => require('./card-renderer').drawNoise(...args)
const drawCircularAvatar = (...args) => require('./card-renderer').drawCircularAvatar(...args)
const fitCardText = (...args) => require('./card-renderer').fitCardText(...args)
const renderWelcomeCard = options => cardPool().render('welcome', options)
const renderLeaveCard = options => cardPool().render('leave', options)

function projectedCardData(member) {
  return { username: member.user.username, discriminator: member.user.discriminator,
    guildName: member.guild.name, memberCount: member.guild.memberCount }
}
async function renderConfiguredMembershipCard(settings, member, kind, { dm = false, media = cardMedia, renderer = cardPool(), assets = cardAssetsFor(settings) } = {}) {
  const get = key => settings.get(member.guild.id, `${kind}.${key}${dm ? 'dm' : ''}`)
  const rawColor = get('framecolor')
  const frameColor = typeof rawColor === 'string' ? rawColor : '#3A98F0'
  const accentColor = /^(#[0-9a-f]{6}|white)$/i.test(frameColor) ? frameColor.replace(/^white$/i, '#FFFFF9') : '#5865F2'
  const options = { data: projectedCardData(member), accentColor,
    frameColor: kind === 'welcome' && get('frame') !== false && /^(#[0-9a-f]{6}|white)$/i.test(frameColor) ? frameColor : null,
    showAvatar: kind === 'welcome' ? get('pb') !== false : Boolean(get('pb')),
    showDiscriminator: Boolean(get('discriminator')), showMemberCount: Boolean(get('membercount')),
    showServerName: Boolean(get('servername')), isLeave: kind === 'leave' }
  const background = get('background')
  const avatarURL = options.showAvatar ? member.user.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true }) : null
  return renderer.render(kind, async () => {
    const selection = assets ? await assets.background(member.guild.id, `${kind}${dm ? 'Dm' : ''}`) : { managed: false }
    const [avatarBuffer, backgroundBuffer] = await Promise.all([avatarURL ? media.optional(avatarURL) : null,
      selection.managed ? selection.buffer : background ? media.optional(background) : null])
    return { ...options, avatarBuffer, backgroundBuffer }
  })
}
const renderConfiguredWelcomeCard = (settings, member, options) => renderConfiguredMembershipCard(settings, member, 'welcome', options)
const renderConfiguredLeaveCard = (settings, member, options) => renderConfiguredMembershipCard(settings, member, 'leave', options)

module.exports = { drawNoise, drawCircularAvatar, fitCardText, renderLeaveCard, renderWelcomeCard, renderConfiguredWelcomeCard, renderConfiguredLeaveCard }
