const { version: djsVersion } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { formatDuration } = require('../../utils/timeFormat')
const { replyEmbed } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

function mb (bytes) {
  const n = Number(bytes || 0)
  return (n / 1024 / 1024).toFixed(1)
}

module.exports = {
  DESCRIPTION: 'Muestra info del bot y estado del sistema.',
  ALIASES: ['bot', 'about', 'info'],
  async execute (client, message) {
    let pkg = null
    try {
      // eslint-disable-next-line import/no-dynamic-require
      pkg = require('../../../package.json')
    } catch (e) {}

    const uptime = formatDuration(Math.floor(process.uptime() * 1000))
    const mem = process.memoryUsage()
    const wsPing = Math.round(Number(client.ws.ping || 0))

    const invite = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot%20applications.commands&permissions=0`
    const support = String(process.env.SUPPORT_SERVER || '').trim()

    return replyEmbed(client, message, {
      system: 'info',
      kind: 'info',
      title: `${Emojis.crown} ${client.user.username}`,
      description: [
        headerLine(Emojis.system, 'Estado del bot'),
        `${Emojis.dot} **Versión:** ${Format.inlineCode(pkg?.version || 'n/a')}`,
        `${Emojis.dot} **Discord.js:** ${Format.inlineCode(djsVersion)}`,
        `${Emojis.dot} **Node:** ${Format.inlineCode(process.version)}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Emojis.loading} **Uptime:** ${Format.inlineCode(uptime)}`,
        `${Emojis.dot} ${Emojis.stats} **WS Ping:** ${Format.inlineCode(`${wsPing}ms`)}`,
        `${Emojis.dot} ${Emojis.inventory} **RAM:** ${Format.inlineCode(`${mb(mem.rss)} MB RSS`)}`,
        Format.softDivider(20),
        `${Emojis.dot} **Slash commands:** ${Format.inlineCode(client.slashCommands.size)}`,
        `${Emojis.dot} **Prefix (compat):** ${Format.inlineCode(client.commands.size)}`,
        `${Emojis.dot} **Servidores:** ${Format.inlineCode(client.guilds.cache.size)}`,
        '',
        `${Emojis.dot} ${Emojis.arrow} Invite: ${invite}`,
        support ? `${Emojis.dot} ${Emojis.ticket} Support: ${support}` : null
      ].filter(Boolean).join('\n'),
      thumbnail: client.user.displayAvatarURL({ size: 256 }),
      signature: 'Sistema vivo y sincronizado'
    })
  }
}
