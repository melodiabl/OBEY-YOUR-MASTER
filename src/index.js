require('dotenv').config({ override: true })
require('colors')
const Bot = require('./structures/Client.js')
;(async () => {
  try {
    const sodium = require('libsodium-wrappers')
    if (sodium?.ready) await sodium.ready
  } catch (e) {
    console.warn('[Voice] libsodium-wrappers no disponible:', e?.message || e)
  }

  new Bot()
})()
