const { cardPool } = require('./card-pool')
const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.cards
  client.cards = cardPool()
  client.stopCards = () => client.cards.close()
  initialized.add(client)
  return client.cards
}
