const { PermissionFlagsBits: F } = require('discord.js')

async function requireSetupAccess(client, context) {
  if (client._shuttingDown || client._dbReady === false) throw new Error('setup_unavailable')
  const guild = client.guilds?.cache?.get(context.guildId)
  if (!guild || guild.available === false) throw new Error('setup_denied')
  const [member, bot, channel] = await Promise.all([
    guild.members.fetch({ user: context.actorId, force: true }), guild.members.fetchMe({ force: true }),
    guild.channels.fetch(context.channelId),
  ])
  if (member?.id !== context.actorId || member.guild?.id !== guild.id ||
    channel?.id !== context.channelId || channel.guildId !== guild.id || !channel.permissionsFor(member)?.has(F.ViewChannel) ||
    !channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) throw new Error('setup_denied')
  const access = { guild, member, bot, channel }
  if (context.authorizeActor) await context.authorizeActor(access, context)
  else if (!member.permissions.has(context.actorPermission ?? F.Administrator)) throw new Error('setup_denied')
  if (client._shuttingDown || client._dbReady === false) throw new Error('setup_unavailable')
  return access
}

module.exports = { requireSetupAccess }
