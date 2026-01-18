const cache = new Map()

function cached (key, factory) {
  if (cache.has(key)) return cache.get(key)
  const value = factory()
  cache.set(key, value)
  return value
}

module.exports = {
  get clans () {
    return cached('clans', () => require('./clans/clanService'))
  },
  get economy () {
    return cached('economy', () => ({
      ...require('./economy/economyService'),
      ...require('./economy/ecoActionsService')
    }))
  },
  get games () {
    return cached('games', () => ({
      ...require('./games/casinoService'),
      ...require('./games/rpsService')
    }))
  },
  get giveaways () {
    return cached('giveaways', () => ({
      ...require('./giveaways/giveawayService'),
      ...require('./giveaways/giveawayScheduler')
    }))
  },
  get items () {
    return cached('items', () => ({
      ...require('./items/itemsService'),
      itemsCatalog: require('./items/itemsCatalog')
    }))
  },
  get jobs () {
    return cached('jobs', () => ({
      ...require('./jobs/jobsService'),
      jobsCatalog: require('./jobs/jobsCatalog')
    }))
  },
  get levels () {
    return cached('levels', () => require('./levels/levelsService'))
  },
  get moderation () {
    return cached('moderation', () => ({
      ...require('./moderation/moderationService'),
      ...require('./moderation/warnThresholdService')
    }))
  },
  get pets () {
    return cached('pets', () => require('./pets/petService'))
  },
  get quests () {
    return cached('quests', () => require('./quests/questService'))
  },
  get reputation () {
    return cached('reputation', () => require('./reputation/reputationService'))
  },
  get tickets () {
    return cached('tickets', () => require('./tickets/ticketService'))
  },
  get fun () {
    return cached('fun', () => ({
      ...require('./fun/animals'),
      ...require('./fun/funContent'),
      ...require('./fun/funImages'),
      ...require('./fun/textTransforms')
    }))
  }
}
