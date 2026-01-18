// Catálogo base de trabajos. Escalable: puedes moverlo a DB más adelante.
module.exports = Object.freeze([
  {
    id: 'miner',
    name: 'Minero',
    basePayMin: 60,
    basePayMax: 110,
    cooldownMs: 60 * 60 * 1000
  },
  {
    id: 'farmer',
    name: 'Granjero',
    basePayMin: 50,
    basePayMax: 100,
    cooldownMs: 45 * 60 * 1000
  },
  {
    id: 'developer',
    name: 'Desarrollador',
    basePayMin: 80,
    basePayMax: 150,
    cooldownMs: 2 * 60 * 60 * 1000
  }
])
