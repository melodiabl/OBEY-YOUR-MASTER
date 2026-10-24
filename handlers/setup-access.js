const { PermissionFlagsBits: F } = require('discord.js')

async function requireSetupAccess(client, context) {
  if (client._shuttingDown || client._dbReady === false) throw new Error('setup_unavailable')
  const guild = client.guilds?.cache?.get(context.guildId)
  if (!guild || guild.available === false) throw new Error('setup_denied')
  const [member, bot, channel] = await Promise.all([
    guild.members.fetch({ user: context.actorId, force: true }), guild.members.fetchMe({ force: true }),
    guild.channels.fetch(context.channelId, { force: true }),
  ])
  if (member?.id !== context.actorId || member.guild?.id !== guild.id ||
    channel?.id !== context.channelId || channel.guildId !== guild.id) throw new Error('setup_denied')
  if (!channel.permissionsFor(member)?.has(F.ViewChannel)) throw new Error('setup_channel_access')
  if (!channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) throw new Error('setup_bot_permissions')
  const access = { guild, member, bot, channel }
  if (context.authorizeActor) await context.authorizeActor(access, context)
  else if (!member.permissions.has(context.actorPermission ?? F.Administrator)) throw new Error('setup_actor_permissions')
  if (client._shuttingDown || client._dbReady === false) throw new Error('setup_unavailable')
  return access
}

module.exports = { requireSetupAccess }
