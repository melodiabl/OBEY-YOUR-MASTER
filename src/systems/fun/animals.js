const { fetchJson } = require('../../utils/httpClient')

async function getAnimal (type) {
  const t = String(type || '').toLowerCase()

  // APIs públicas sin auth. Si fallan, el comando responde con error manejado.
  if (t === 'fox') {
    const data = await fetchJson('https://randomfox.ca/floof/')
    return { image: data.image || data.link, fact: null }
  }
  if (t === 'duck') {
    const data = await fetchJson('https://random-d.uk/api/v2/random')
    return { image: data.url, fact: null }
  }

  // some-random-api
  const map = {
    cat: 'cat',
    dog: 'dog',
    panda: 'panda',
    bunny: 'rabbit',
    capybara: 'capybara'
  }
  const api = map[t]
  if (api) {
    const data = await fetchJson(`https://some-random-api.com/animal/${api}`)
    return { image: data.image, fact: data.fact || null }
  }

  throw new Error('Animal no soportado.')
}

module.exports = { getAnimal }
