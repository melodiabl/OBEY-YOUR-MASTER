const { z } = require('zod')
const { PermissionFlagsBits: F } = require('discord.js')
const { createSetupSettings, SetupSettingsError } = require('../setup-settings')
const fail = code => { throw new SetupSettingsError(code) }

function createLogConfiguration(client, context, fields) {
  const store = client.settings
  const schema = z.strictObject(Object.fromEntries(Object.entries(fields).map(([id, field]) => [id, field.schema]))).partial()
    .refine(value => Object.keys(value).length > 0 && Object.values(value).every(item => item !== undefined))
  const currentGuild = () => {
    if (!client._dbReady || client._shuttingDown) fail('setup_unavailable')
    const guild = client.guilds.cache.get(context.guildId)
    if (!guild || guild.available === false) fail('setup_denied')
    return guild
  }
  const checkActor = (guild, actor) => {
    if (actor?.id !== context.actorId || actor.guild?.id !== guild.id || !actor.permissions.has(F.ManageGuild)) fail('setup_denied')
  }
  async function authorize() {
    const guild = currentGuild(), actor = await guild.members.fetch({ user: context.actorId, force: true })
    checkActor(guild, actor)
    return { guild, actor }
  }
  function resources(guild, actor, channels, bot, patch) {
    for (const [id, value] of Object.entries(patch)) {
      const field = fields[id]
      if (!['channel', 'channels'].includes(field.type)) continue
      for (const channelId of (field.type === 'channels' ? value : [value])) {
        if (!channelId || channelId === 'no') continue
        const channel = channels.get(channelId)
        if (!channel || channel.guildId !== guild.id || !channel.permissionsFor(actor)?.has(F.ViewChannel)) fail('setup_resource')
        if (field.type === 'channel' && (![0, 5].includes(channel.type) || !channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks]))) fail('setup_resource')
      }
    }
  }
  function repository(patch, channels, bot) {
    return createSetupSettings({ model: store.model, guildKey: store.guildKey, get: store.get.bind(store), patchCached: store.patchCached.bind(store),
      exclusive(operation) { return store.exclusive(() => {
        const guild = currentGuild(), actor = guild.members.cache.get(context.actorId)
        checkActor(guild, actor)
        if (patch) resources(guild, actor, channels, bot, patch)
        return operation()
      }) },
    }, fields, () => Boolean(client._shuttingDown))
  }
  return {
    async read(guildId = context.guildId) {
      if (guildId !== context.guildId) fail('setup_denied')
      await authorize()
      return repository().read(guildId)
    },
    async save(guildId, input, revision) {
      if (guildId !== context.guildId) fail('setup_denied')
      const parsed = schema.safeParse(input)
      if (!parsed.success || !Object.keys(parsed.data).length) fail('invalid_setup')
      const access = await authorize()
      const [channels, bot] = await Promise.all([access.guild.channels.fetch(), access.guild.members.fetchMe({ force: true })])
      resources(access.guild, access.actor, channels, bot, parsed.data)
      return repository(parsed.data, channels, bot).save(guildId, parsed.data, revision)
    },
  }
}
module.exports = { createLogConfiguration }
