const TTLCache = require('../../core/cache/ttlCache')
const { tryDebitWallet, creditWallet } = require('../economy/economyService')

// Sesiones en memoria (por servidor+usuario) para minijuegos stateful.
const guessNumberSessions = new TTLCache({ defaultTtlMs: 10 * 60_000, maxSize: 50_000 })

function clampInt (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, Math.trunc(x)))
}

function randInt (min, max) {
  const a = clampInt(min, -1_000_000_000, 1_000_000_000)
  const b = clampInt(max, -1_000_000_000, 1_000_000_000)
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function coinflip () {
  return Math.random() < 0.5 ? 'heads' : 'tails'
}

function slotsSpin () {
  const symbols = ['🍒', '🍋', '🍇', '🍉', '⭐', '💎']
  const a = symbols[randInt(0, symbols.length - 1)]
  const b = symbols[randInt(0, symbols.length - 1)]
  const c = symbols[randInt(0, symbols.length - 1)]
  return [a, b, c]
}

function slotsPayoutMultiplier (reels) {
  const [a, b, c] = reels
  if (a === b && b === c) {
    if (a === '💎') return 5
    if (a === '⭐') return 3
    return 2
  }
  if (a === b || b === c || a === c) return 1.25
  return 0
}

async function playCoinflipBet ({ client, guildID, userID, choice, amount }) {
  const bet = clampInt(amount, 1, 1_000_000_000)
  const pick = String(choice || '').toLowerCase()
  if (!['heads', 'tails'].includes(pick)) throw new Error('Elección inválida: heads|tails.')

  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: bet, type: 'game_bet', meta: { game: 'coinflip' } })
  const result = coinflip()
  const win = result === pick
  const payout = win ? Math.floor(bet * 2) : 0
  if (payout > 0) await creditWallet({ client, guildID, actorID: userID, userID, amount: payout, type: 'game_payout', meta: { game: 'coinflip' } })
  return { result, win, bet, payout }
}

async function playDiceBet ({ client, guildID, userID, sides, amount }) {
  const bet = clampInt(amount, 1, 1_000_000_000)
  const s = clampInt(sides, 2, 1000)
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: bet, type: 'game_bet', meta: { game: 'dice', sides: s } })
  const roll = randInt(1, s)
  // Regla simple: gana si sale el valor máximo (house edge).
  const win = roll === s
  const payout = win ? bet * s : 0
  if (payout > 0) await creditWallet({ client, guildID, actorID: userID, userID, amount: payout, type: 'game_payout', meta: { game: 'dice', sides: s } })
  return { roll, sides: s, win, bet, payout }
}

async function playSlotsBet ({ client, guildID, userID, amount }) {
  const bet = clampInt(amount, 1, 1_000_000_000)
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: bet, type: 'game_bet', meta: { game: 'slots' } })
  const reels = slotsSpin()
  const mult = slotsPayoutMultiplier(reels)
  const payout = mult > 0 ? Math.floor(bet * mult) : 0
  const win = payout > 0
  if (payout > 0) await creditWallet({ client, guildID, actorID: userID, userID, amount: payout, type: 'game_payout', meta: { game: 'slots', mult } })
  return { reels, mult, win, bet, payout }
}

async function playHigherLowerBet ({ client, guildID, userID, guess, amount }) {
  const bet = clampInt(amount, 1, 1_000_000_000)
  const pick = String(guess || '').toLowerCase()
  if (!['higher', 'lower'].includes(pick)) throw new Error('Elección inválida: higher|lower.')
  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: bet, type: 'game_bet', meta: { game: 'higherlower' } })
  const n = randInt(1, 100)
  const outcome = n >= 51 ? 'higher' : 'lower'
  const win = outcome === pick
  const payout = win ? Math.floor(bet * 1.8) : 0
  if (payout > 0) await creditWallet({ client, guildID, actorID: userID, userID, amount: payout, type: 'game_payout', meta: { game: 'higherlower' } })
  return { number: n, outcome, win, bet, payout }
}

function guessKey (guildID, userID) {
  return `${guildID}:${userID}`
}

async function startGuessNumber ({ client, guildID, userID, betAmount }) {
  const bet = clampInt(betAmount, 1, 1_000_000_000)
  const key = guessKey(guildID, userID)
  const existing = guessNumberSessions.get(key)
  if (existing) throw new Error('Ya tienes una partida activa. Usa `/game guessnumber guess` o espera que expire.')

  await tryDebitWallet({ client, guildID, actorID: userID, userID, amount: bet, type: 'game_bet', meta: { game: 'guessnumber' } })

  const session = {
    target: randInt(1, 100),
    attemptsLeft: 5,
    bet,
    startedAt: Date.now()
  }
  guessNumberSessions.set(key, session, 10 * 60_000)
  return { bet, attemptsLeft: session.attemptsLeft }
}

async function guessGuessNumber ({ client, guildID, userID, number }) {
  const key = guessKey(guildID, userID)
  const session = guessNumberSessions.get(key)
  if (!session) throw new Error('No tienes una partida activa. Usa `/game guessnumber start`.')

  const n = clampInt(number, 1, 100)
  session.attemptsLeft -= 1

  if (n === session.target) {
    guessNumberSessions.delete(key)
    const payout = Math.floor(session.bet * 2.5)
    await creditWallet({ client, guildID, actorID: userID, userID, amount: payout, type: 'game_payout', meta: { game: 'guessnumber' } })
    return { status: 'win', target: session.target, bet: session.bet, payout, attemptsLeft: session.attemptsLeft }
  }

  if (session.attemptsLeft <= 0) {
    guessNumberSessions.delete(key)
    return { status: 'lose', target: session.target, bet: session.bet, payout: 0, attemptsLeft: 0 }
  }

  guessNumberSessions.set(key, session, 10 * 60_000)
  return { status: n < session.target ? 'higher' : 'lower', bet: session.bet, attemptsLeft: session.attemptsLeft }
}

module.exports = {
  randInt,
  playCoinflipBet,
  playDiceBet,
  playSlotsBet,
  playHigherLowerBet,
  startGuessNumber,
  guessGuessNumber
}

