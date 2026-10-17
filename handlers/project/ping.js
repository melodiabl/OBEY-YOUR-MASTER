const { EmbedBuilder } = require('discord.js')
const { performance } = require('node:perf_hooks')
const { t, localeFor } = require('../i18n')

async function runPing(client, context, { slash = false, locale = localeFor(client, context.guildId || context.guild?.id), style, now = () => performance.now() } = {}) {
  const tr = key => t(locale, 'project.ping.' + key), guildId = context.guildId || context.guild?.id
  const started = now()
  let message
  if (slash) await context.deferReply({ ephemeral: true })
  else message = await context.reply({ content: tr('loading'), allowedMentions: { parse: [] } })
  const elapsed = now() - started, edit = payload => slash ? context.editReply(payload) : message.edit(payload)
  try {
    const value = n => Number.isFinite(n) && n >= 0 ? Math.round(n) + ' ms' : tr('unavailable')
    const player = client.shoukaku?.players?.get(guildId), view = client.music?.getNodes?.(guildId)
    const label = player && view?.nodes?.find(n => n.id === view.currentId)?.label
    const embed = new EmbedBuilder().setColor(style?.color ?? 0xFFD36F).setTitle(tr('title'))
      .addFields(
        { name: tr('acknowledgement'), value: value(elapsed), inline: true },
        { name: tr('gateway'), value: value(client.ws?.ping), inline: true },
        { name: tr('voice'), value: value(player?.ping), inline: true },
        { name: tr('node'), value: label || tr('noVoice') },
      ).setFooter({ text: tr('explanation') })
    return await edit({ content: '', embeds: [embed], allowedMentions: { parse: [] } })
  } catch (error) {
    console.error('[Ping] Failed:', { name: error?.name || 'Error' })
    return edit({ content: t(locale, 'common.error'), embeds: [], allowedMentions: { parse: [] } })
  }
}
module.exports = { runPing }
