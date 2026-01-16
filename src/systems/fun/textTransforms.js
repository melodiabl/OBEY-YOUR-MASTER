const translateApi = require('@vitalets/google-translate-api')

const SMALLCAPS_MAP = Object.freeze({
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
  s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
})

const ZALGO_UP = ['\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306', '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a', '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303', '\u0302', '\u030c', '\u0350', '\u0300', '\u0301', '\u030b', '\u030f', '\u0312', '\u0313', '\u0314', '\u033d', '\u0309', '\u0363', '\u0364', '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036a', '\u036b', '\u036c', '\u036d', '\u036e', '\u036f', '\u033e', '\u035b', '\u0346', '\u031a']
const ZALGO_DOWN = ['\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e', '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a', '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331', '\u0332', '\u0333', '\u0339', '\u033a', '\u033b', '\u033c', '\u0345', '\u0347', '\u0348', '\u0349', '\u034d', '\u034e', '\u0353', '\u0354', '\u0355', '\u0356', '\u0359', '\u035a', '\u0323']

function reverseText (text) {
  return [...String(text)].reverse().join('')
}

function spoilerText (text) {
  const t = String(text)
  if (!t.trim()) return t
  return t.split(/\s+/).map(w => `||${w}||`).join(' ')
}

function clapText (text) {
  const t = String(text).trim()
  return t ? t.split(/\s+/).join(' 👏 ') : t
}

function mockText (text) {
  const t = String(text)
  let out = ''
  let flip = false
  for (const ch of t) {
    if (/[a-z]/i.test(ch)) {
      out += flip ? ch.toUpperCase() : ch.toLowerCase()
      flip = !flip
    } else {
      out += ch
    }
  }
  return out
}

function uwuText (text) {
  return String(text)
    .replace(/(?:r|l)/g, 'w')
    .replace(/(?:R|L)/g, 'W')
    .replace(/n([aeiou])/gi, 'ny$1')
    .replace(/ove/gi, 'uv')
}

function zalgoText (text, intensity = 5) {
  const t = String(text)
  const n = Math.max(1, Math.min(15, Number(intensity) || 5))
  let out = ''
  for (const ch of t) {
    out += ch
    if (!/[a-z0-9]/i.test(ch)) continue
    for (let i = 0; i < n; i++) {
      const up = ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)]
      const down = ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)]
      out += Math.random() > 0.5 ? up : down
    }
  }
  return out
}

function boldText (text) {
  return `**${String(text)}**`
}

function smallcapsText (text) {
  const t = String(text)
  let out = ''
  for (const ch of t) {
    const low = ch.toLowerCase()
    out += SMALLCAPS_MAP[low] || ch
  }
  return out
}

async function translateText (text, lang) {
  const to = String(lang || 'es').trim().toLowerCase()
  const res = await translateApi(String(text), { to })
  return res.text
}

function autocorrectText (text) {
  // Autocorrección simple y segura (sin IA): normaliza espacios y capitaliza.
  const t = String(text).trim().replace(/\s+/g, ' ')
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function summarizeFallback (text, max = 280) {
  const t = String(text).trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return t.slice(0, max - 1) + '…'
}

function emojiifyText (text) {
  const dict = {
    love: '❤️',
    feliz: '😄',
    triste: '😢',
    wow: '😮',
    fuego: '🔥',
    cool: '😎',
    money: '💰',
    win: '🏆',
    fail: '💀'
  }
  return String(text).split(/\s+/).map(w => {
    const k = w.toLowerCase().replace(/[^\p{L}\p{N}_-]/gu, '')
    return dict[k] ? `${w} ${dict[k]}` : w
  }).join(' ')
}

function shrinkText (text) {
  // "Shrink" simple: elimina vocales internas (mantiene primera letra de cada palabra).
  return String(text).split(/\s+/).map(w => {
    if (w.length <= 3) return w
    const first = w[0]
    const rest = w.slice(1).replace(/[aeiouáéíóú]/gi, '')
    return first + rest
  }).join(' ')
}

function expandText (text) {
  return String(text).split('').join(' ')
}

function censorText (text) {
  const bad = ['mierda', 'puta', 'puto', 'idiota', 'imbecil', 'pendejo', 'cabron']
  const t = String(text)
  let out = t
  for (const w of bad) {
    const re = new RegExp(`\\b${w}\\b`, 'gi')
    out = out.replace(re, '*'.repeat(w.length))
  }
  return out
}

module.exports = {
  reverseText,
  spoilerText,
  clapText,
  uwuText,
  mockText,
  zalgoText,
  boldText,
  smallcapsText,
  translateText,
  autocorrectText,
  summarizeFallback,
  emojiifyText,
  shrinkText,
  expandText,
  censorText
}

