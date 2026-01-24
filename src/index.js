require('dotenv').config({ override: true })
require('colors')

try {
  const args = new Set(process.argv.slice(2))
  const showBanner =
    process.stdout.isTTY && !args.has('--no-banner') && process.env.NO_BANNER !== '1' && process.env.NO_BANNER !== 'true'

  if (showBanner) {
    const CFonts = require('cfonts')
    CFonts.say('OBEY YOUR MASTER', { font: 'block', align: 'center', gradient: ['red', 'magenta'] })
  }
} catch (e) {}

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
