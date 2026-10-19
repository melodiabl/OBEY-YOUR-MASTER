const { EmbedBuilder, PermissionFlagsBits: F, GatewayIntentBits: I } = require('discord.js')
const { requireSetupAccess } = require('../setup-access')
const { t, localeFor } = require('../i18n')
const { CATEGORIES, resolveLogDestination, mayRevealAudit } = require('./policy')
const { registry } = require('../assets/registry')

async function diagnoseLogs(client, context, values) {
  const { guild, member, bot } = await requireSetupAccess(client, { ...context, actorPermission: F.ManageGuild })
  const locale = localeFor(client, guild.id), copy = key => t(locale, 'logs.diagnostics.' + key)
  const settings = { logger: { channel: values.defaultChannel }, logChannels: Object.fromEntries(CATEGORIES.map(key => [key, values[key]])) }
  const targets = new Map()
  const embed = new EmbedBuilder().setColor(0x5865F2).setTitle(`${registry.markup('icon.info')} ${copy('title')}`).setDescription(copy('description'))
  for (const category of CATEGORIES) {
    const destination = resolveLogDestination(settings, category)
    let status = copy(destination.state === 'disabled' ? 'disabled' : destination.state === 'invalid' ? 'invalid' : 'unset')
    if (destination.channelId) {
      if (!targets.has(destination.channelId)) targets.set(destination.channelId, await guild.channels.fetch(destination.channelId, { force: true }).catch(() => null))
      const channel = targets.get(destination.channelId)
      status = !channel || channel.guildId !== guild.id || ![0, 5].includes(channel.type) ? copy('missing')
        : !channel.permissionsFor(member)?.has(F.ViewChannel) ? copy('denied')
          : !channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks]) ? copy('botPermissions')
            : `<#${channel.id}> · ${copy('ready')}`
      if (category === 'moderation' && channel?.guildId === guild.id && channel.permissionsFor(member)?.has(F.ViewChannel) && !mayRevealAudit(channel, guild)) status += '\n' + copy('auditAudience')
    }
    embed.addFields({ name: t(locale, 'logs.categories.' + category), value: status, inline: true })
  }
  const hasIntent = intent => Boolean(client.options?.intents?.has(intent))
  embed.addFields({ name: copy('coverage'), value: [
    copy(bot.permissions.has(F.ViewAuditLog) && hasIntent(I.GuildModeration) ? 'auditReady' : 'auditLimited'),
    copy(hasIntent(I.GuildMembers) ? 'membersReady' : 'membersLimited'),
    copy(hasIntent(I.GuildMessages) ? 'messagesReady' : 'messagesLimited'),
    copy(hasIntent(I.GuildVoiceStates) ? 'voiceReady' : 'voiceLimited'),
    values.includeMessageContent ? copy(hasIntent(I.MessageContent) ? 'contentOptIn' : 'contentLimited') : copy('contentOff'),
  ].join('\n') })
  return { embeds: [embed], allowedMentions: { parse: [] } }
}
module.exports = { diagnoseLogs }
