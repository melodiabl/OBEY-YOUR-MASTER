const { PermissionFlagsBits } = require('discord.js')
const { prefixAllowed } = require('../../../../handlers/moderation/member-access')
const { validId, HistoryError } = require('../domain/warnings')

async function requireBanListAccess(client, guild, actorId, context) {
  context.check()
  if (!validId(guild?.id) || !validId(actorId) || guild.available === false) throw new HistoryError('accessDenied')
  let actor, bot
  try {
    await guild.roles.fetch()
    context.check()
    ;[actor, bot] = await Promise.all([
      guild.members.fetch({ user: actorId, force: true }),
      guild.members.fetchMe({ force: true }),
    ])
  } catch { throw new HistoryError('unavailable') }
  context.check()
  if (actor?.id !== actorId || bot?.id !== client.user?.id) throw new HistoryError('unavailable')
  if (!prefixAllowed(client, guild, actor, 'ban')) throw new HistoryError('accessDenied')
  if (!bot.permissions?.has(PermissionFlagsBits.BanMembers)) throw new HistoryError('botPermission')
}

async function readBanList(client, guild, actorId, requested, context) {
  await requireBanListAccess(client, guild, actorId, context)
  const perPage = 8, batchSize = 1000
  let total = 0, after, requestedRows = [], lastPageRows = []
  for (let batchNumber = 0; batchNumber < 100; batchNumber++) {
    let bans
    try { bans = await guild.bans.fetch({ limit: batchSize, after, cache: false }) }
    catch { throw new HistoryError('unavailable') }
    context.check()
    if (!bans || !Number.isSafeInteger(bans.size) || bans.size > batchSize || typeof bans.values !== 'function')
      throw new HistoryError('unavailable')
    let lastId = after
    for (const ban of bans.values()) {
      const id = ban?.user?.id
      if (!validId(id) || lastId && BigInt(id) <= BigInt(lastId)) throw new HistoryError('unavailable')
      lastId = id
      const page = Math.floor(total / perPage) + 1
      if (total % perPage === 0) lastPageRows = []
      lastPageRows.push(ban)
      if (page === requested) requestedRows.push(ban)
      total++
    }
    if (bans.size < batchSize) {
      const pages = Math.max(1, Math.ceil(total / perPage)), page = Math.min(requested, pages)
      await requireBanListAccess(client, guild, actorId, context)
      return { rows: page === requested ? requestedRows : lastPageRows, total, page, pages }
    }
    after = lastId
  }
  throw new HistoryError('unavailable')
}

module.exports = { readBanList }
