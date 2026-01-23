const CATALOG = Object.freeze({
  pan: { name: 'Pan', price: 50, emoji: '🍞' },
  hacha: { name: 'Hacha', price: 150, emoji: '🪓' },
  cana: { name: 'Caña', price: 200, emoji: '🎣' },
  elixir: { name: 'Elixir', price: 500, emoji: '🧪' },
  escudo: { name: 'Escudo', price: 300, emoji: '🛡️' }
})

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  CATALOG,
  money
}

