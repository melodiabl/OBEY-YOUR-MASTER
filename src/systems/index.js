const cache = new Map()

function cached (key, factory) {
  if (cache.has(key)) return cache.get(key)
  const value = factory()
  cache.set(key, value)
  return value
}

function requireOneOf (paths, { stub, label } = {}) {
  const list = Array.isArray(paths) ? paths.filter(Boolean) : []
  for (const p of list) {
    try {
      // eslint-disable-next-line import/no-dynamic-require
      return require(p)
    } catch (e) {
      const msg = String(e?.message || '')
      const notFoundThis = e?.code === 'MODULE_NOT_FOUND' && msg.includes(`Cannot find module '${p}'`)
      if (notFoundThis) continue
      throw e
    }
  }

  if (label) console.warn(`[systems] Módulo opcional no disponible: ${label}`.yellow || `[systems] Módulo opcional no disponible: ${label}`)
  return stub
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
  },
  get logs () {
    return cached('logs', () => requireOneOf(
      ['./logs/logService', './Logs/logService'],
      {
        label: 'logs/logService',
        stub: { sendLog: async () => {} }
      }
    ))
  },
  get welcome () {
    return cached('welcome', () => require('./welcome/welcomeService'))
  },
  get afk () {
    return cached('afk', () => require('./afk/afkService'))
  },
  get suggestions () {
    return cached('suggestions', () => require('./suggestions/suggestionService'))
  },
  get ai () {
    return cached('ai', () => require('./ai/aiService'))
  }
}
