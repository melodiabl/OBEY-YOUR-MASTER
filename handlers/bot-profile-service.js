const { z } = require('zod')
const { Routes } = require('discord.js')
const { globalConfigurationFile } = require('./global-configuration')
const { requireBotOwnerAccess } = require('./bot-owner-access')
const { runSetupOperation } = require('./setup-operations')
const { cardMediaURL } = require('./card-media')
const { validateAvatarImage, avatarMedia } = require('./avatar-media')
const ownerFileDefault = globalConfigurationFile('config.json'), active = new WeakSet()
const fail = code => { throw Object.assign(new Error(code), { code }) }
const usernameSchema = z.string().refine(value => !/[\p{Cc}\p{Cf}]/u.test(value) && value.isWellFormed())
  .transform(value => value.trim().replace(/\s+/gu, ' ')).pipe(z.string().min(2).max(32))
  .refine(value => !/[@#:`]/u.test(value) && !/discord/i.test(value) && !['everyone', 'here'].includes(value.toLowerCase()))
function performBotProfileChange(client, context, change, { ownerFile = ownerFileDefault, loadAvatar = source => avatarMedia.load(source), timeoutMs = 20000 } = {}) {
  let expired = false, admitted = false, timer
  const available = () => { if (expired || client._shuttingDown) fail('setup_unavailable') }
  const operation = runSetupOperation(client, async () => {
    await requireBotOwnerAccess(client, context, ownerFile)
    available()
    if (active.has(client)) fail('profile_busy')
    active.add(client)
    try {
      let value, expectedName
      if (change?.kind === 'name') {
        const parsed = usernameSchema.safeParse(change.value)
        if (!parsed.success) fail('profile_name')
        value = expectedName = parsed.data
      } else if (change?.kind === 'avatar') {
        try {
          if (typeof change.value !== 'string' || change.value.length > 2048) fail('profile_avatar')
          cardMediaURL(change.value)
          const buffer = await loadAvatar(change.value)
          available()
          const image = await validateAvatarImage(buffer)
          value = `data:${image.type};base64,${buffer.toString('base64')}`
        } catch { fail('profile_avatar') }
      } else fail('profile_invalid')
      available()
      await requireBotOwnerAccess(client, context, ownerFile)
      available()
      let user
      const botId = client.user.id
      try {
        admitted = true
        user = await client.rest.patch(Routes.user(), { body: change.kind === 'name' ? { username: value } : { avatar: value } })
      } catch (error) { fail(error?.status === 429 || error?.name === 'RateLimitError' ? 'profile_rate_limited' : 'profile_unconfirmed') }
      const key = change.kind === 'name' ? 'username' : 'avatar'
      if (user?.id !== botId || client.user.id !== botId || !Object.hasOwn(user, key) || (change.kind === 'name' ? user.username !== expectedName : !/^(?:a_)?[a-f0-9]{32}$/i.test(user.avatar || ''))) fail('profile_unconfirmed')
      return { kind: change.kind, value: change.kind === 'name' ? user.username : user.avatar }
    } finally { active.delete(client) }
  })
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => { expired = true; reject(Object.assign(new Error('profile_timeout'), { code: admitted ? 'profile_unconfirmed' : 'profile_timeout' })) }, timeoutMs) })
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer))
}
module.exports = { usernameSchema, performBotProfileChange }
