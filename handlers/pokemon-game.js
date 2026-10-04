const { randomInt } = require('node:crypto')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const cache = new Map()

async function getPokemon(id = randomInt(1, 899)) {
  if (!Number.isInteger(id) || id < 1 || id > 898) throw new Error('Pokémon inválido.')
  if (cache.has(id)) return cache.get(id)
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('No se pudo cargar el Pokémon. Intentá de nuevo.')
  const pokemon = await response.json()
  const url = pokemon.sprites?.other?.['official-artwork']?.front_default || pokemon.sprites?.front_default
  const address = new URL(url)
  if (address.protocol !== 'https:' || address.hostname !== 'raw.githubusercontent.com') throw new Error('La ilustración del Pokémon no está disponible.')
  const artwork = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!artwork.ok) throw new Error('No se pudo cargar la ilustración.')
  const image = await loadImage(Buffer.from(await artwork.arrayBuffer()))
  const canvas = createCanvas(image.width, image.height), context = canvas.getContext('2d')
  context.drawImage(image, 0, 0)
  context.globalCompositeOperation = 'source-in'
  context.fillStyle = '#171728'
  context.fillRect(0, 0, image.width, image.height)
  const result = { name: pokemon.name, image: url, hiddenImage: canvas.toBuffer('image/png'), types: pokemon.types.map(item => item.type.name), abilities: pokemon.abilities.map(item => item.ability.name) }
  if (cache.size >= 300) cache.delete(cache.keys().next().value)
  cache.set(id, result)
  return result
}
module.exports = { getPokemon }
