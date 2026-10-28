const { z } = require('zod')
const { createSetupSettings } = require('./setup-settings')
const { requireSetupAccess } = require('./setup-access')

const idSchema = z.string().regex(/^\d{17,20}$/)
const channelsSchema = z.array(idSchema)
function createBotChannelSettings(client) {
  return createSetupSettings(client.settings, {
    channels: { path: 'botchannel', default: [], schema: channelsSchema },
  }, () => Boolean(client._shuttingDown || client._dbReady === false))
}

async function changeBotChannel(client, context, channelId, action) {
  if (!idSchema.safeParse(channelId).success || !['add', 'remove'].includes(action))
    throw new Error('invalid_bot_channel')
  async function authorize() {
    await requireSetupAccess(client, context)
    if (action === 'add') {
      const access = await requireSetupAccess(client, { ...context, channelId })
      if (!access.channel.isTextBased?.() || access.channel.isThread?.()) throw new Error('invalid_bot_channel')
    }
  }
  await authorize()
  const service = createBotChannelSettings(client), before = await service.read(context.guildId)
  if (!channelsSchema.safeParse(before.values.channels).success) throw new Error('setup_storage')
  const has = before.values.channels.includes(channelId)
  await authorize()
  if (has === (action === 'add')) return { status: 'unchanged', channels: before.values.channels }
  const channels = action === 'add' ? [...new Set([...before.values.channels, channelId])]
    : before.values.channels.filter(id => id !== channelId)
  const saved = await service.save(context.guildId, { channels }, before.revision)
  return { status: action === 'add' ? 'added' : 'removed', channels: saved.values.channels }
}

module.exports = { createBotChannelSettings, changeBotChannel }
