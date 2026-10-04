const { WekyManager } = require('@m3rcena/weky')
const managers = new WeakMap()

function normalize(options) {
  const value = { ...options }
  if (value.interaction?.author) {
    value.message = value.interaction
    delete value.interaction
  }
  value.client ||= value.message?.client || value.interaction?.client
  value.notifyUpdate = false
  if (!value.embed && value.embeds) value.embed = { ...value.embeds[0] }
  if (typeof value.embed?.footer === 'string') value.embed = { ...value.embed, footer: { text: value.embed.footer } }
  if (value.embed?.timestamp) value.embed = { ...value.embed, timestamp: new Date() }
  return value
}

function createGame(name, options, Manager = WekyManager) {
  const value = normalize(options)
  if (['WouldYouRather', 'WillYouPressTheButton', 'NeverHaveIEver'].includes(name)) return require('./games-choice').choice(name, value)
  if (!value.client) throw new Error('No se encontró el cliente del juego.')
  let manager = managers.get(value.client)
  if (!manager) {
    manager = new Manager(value.client)
    managers.set(value.client, manager)
  }
  const method = manager[`create${name}`]
  if (typeof method !== 'function') throw new Error(`Juego no disponible: ${name}`)
  return method.call(manager, value)
}

const names = ['GuessTheNumber', 'GuessThePokemon', 'FastType', 'ChaosWords', 'LieSwatter', 'WouldYouRather', 'WillYouPressTheButton', 'NeverHaveIEver', 'QuickClick', 'ShuffleGuess', 'Fight']
module.exports = { normalize, createGame, ...Object.fromEntries(names.map(name => [name, options => createGame(name, options)])) }
