const { EmbedBuilder, version } = require('discord.js')
const { performance } = require('node:perf_hooks')
const { t, localeFor } = require('../i18n')
const ui = require('../assets/system')
function sampleCpu() {
  const start = process.cpuUsage(), at = performance.now()
  return new Promise(resolve => setTimeout(() => {
    const elapsed = (performance.now() - at) * 1000, usage = process.cpuUsage(start)
    resolve(elapsed > 0 ? (usage.user + usage.system) / elapsed * 100 : null)
  }, 250))
}
async function collectBotInfo(client, guildId, { cpu = sampleCpu } = {}) {
  const guilds = [...(client.guilds?.cache?.values() || [])], memory = process.memoryUsage()
  const player = client.shoukaku?.players?.get(guildId), nodes = client.music?.getNodes?.(guildId)
  const value = await Promise.resolve().then(cpu).catch(() => null)
  const valid = n => Number.isFinite(n) && n >= 0 ? n : null
  return { guilds: guilds.length, members: guilds.reduce((sum, guild) => sum + (guild.memberCount ?? guild.members?.cache?.size ?? 0), 0),
    cachedUsers: client.users?.cache?.size || 0, voiceConnections: guilds.filter(g => g.members?.me?.voice?.channelId).length,
    cpuPercent: valid(value), ramMb: memory.rss / 1024 / 1024, heapMb: memory.heapUsed / 1024 / 1024,
    uptimeMs: client.uptime ?? process.uptime() * 1000, gatewayPing: valid(client.ws?.ping), voicePing: valid(player?.ping),
    node: player ? nodes?.nodes?.find(n => n.id === nodes.currentId)?.label || null : null }
}
function buildBotInfo(client, data, locale, style = {}) {
  const tr = (key, vars) => t(locale, 'project.botInfo.' + key, vars), unavailable = tr('unavailable')
  const number = (value, unit = '') => Number.isFinite(value) ? value.toFixed(1) + unit : unavailable
  const ping = value => Number.isFinite(value) ? Math.round(value) + ' ms' : unavailable
  const seconds = Math.floor(Math.max(0, data.uptimeMs || 0) / 1000)
  const uptime = `${Math.floor(seconds / 86400)}d ${Math.floor(seconds / 3600) % 24}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`
  const embed = new EmbedBuilder().setColor(style?.color ?? 0xFFD36F)
    .setTitle(ui.limit(tr('title', { name: client.user?.username || 'OBEY' }), 256))
    .addFields(
      { name: tr('servers'), value: String(data.guilds), inline: true },
      { name: tr('members'), value: String(data.members), inline: true },
      { name: tr('cachedUsers'), value: String(data.cachedUsers), inline: true },
      { name: tr('uptime'), value: uptime, inline: true },
      { name: tr('gatewayPing'), value: ping(data.gatewayPing), inline: true },
      { name: tr('voiceConnections'), value: String(data.voiceConnections), inline: true },
      { name: tr('process'), value: tr('resources', { cpu: number(data.cpuPercent, '%'), ram: number(data.ramMb, ' MB'), heap: number(data.heapMb, ' MB') }) },
      { name: tr('music'), value: tr('musicState', { node: data.node || tr('noVoice'), ping: ping(data.voicePing) }) },
      { name: tr('versions'), value: `Node.js ${process.version} · Discord.js ${version} · MongoDB/Mongoose` },
    ).setTimestamp()
  const avatar = client.user?.displayAvatarURL?.()
  if (avatar) embed.setThumbnail(avatar)
  return embed
}
async function runBotInfo(client, context, { slash = false, locale = localeFor(client, context.guildId || context.guild?.id), style, collect = collectBotInfo } = {}) {
  let message
  if (slash) await context.deferReply({ ephemeral: true })
  else message = await context.reply({ content: t(locale, 'project.botInfo.loading'), allowedMentions: { parse: [] } })
  const edit = payload => slash ? context.editReply(payload) : message.edit(payload)
  try {
    const data = await collect(client, context.guildId || context.guild?.id)
    return await edit({ content: '', embeds: [buildBotInfo(client, data, locale, style)], allowedMentions: { parse: [] } })
  } catch (error) {
    console.error('[BotInfo] Failed:', { name: error?.name || 'Error' })
    return edit({ content: t(locale, 'common.error'), embeds: [], allowedMentions: { parse: [] } })
  }
}
module.exports = { collectBotInfo, buildBotInfo, runBotInfo }
