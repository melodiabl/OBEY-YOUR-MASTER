'use strict'
const { registry } = require('./registry')
const map = require('../../assets/obey/system-emoji-map.json')
const expressionOverrides = require('../../assets/obey/catalog-expression-overrides.json').overrides
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const tokens = Object.keys(map.unicode).sort((a, b) => b.length - a.length)
const pattern = new RegExp(`<a?:[A-Za-z0-9_]+:([1-9]\\d{16,19})>|${tokens.map(escape).join('|')}`, 'gu')
const lookup = (object, key) => typeof key === 'string' && Object.hasOwn(object, key) ? object[key] : undefined
function createSystemEmoji(assets = registry) {
  const markup = key => assets.markup(key)
  // For bot-owned literals/catalog text only. Never pass a rendered user template to this function.
  function owned(value) {
    if (typeof value !== 'string') return value
    return value.replace(/https?:\/\/[^\s"'`<>]*?(?:cdn|media)\.discordapp\.(?:com|net)\/emojis\/(\d+)\.(?:gif|png|webp)(?:\?[^\s"'`<>\\]*)?/g,(url,id)=>lookup(map.legacyIds, id)?(assets.imageURL?.(lookup(map.legacyIds, id))||''):url).replace(pattern, (original, id) => {
      const key = id ? lookup(map.legacyIds, id) : lookup(map.unicode, original)
      return key ? markup(key) : original
    })
  }
  function component(value) {
    if (value && typeof value === 'object') {
      if (lookup(map.legacyIds, value.id)) return assets.emoji(lookup(map.legacyIds, value.id))
      if (!value.id && lookup(map.unicode, value.name)) return assets.emoji(lookup(map.unicode, value.name))
      return value
    }
    if (typeof value !== 'string') return value
    const tag = /^<(a?):([A-Za-z0-9_]+):([1-9]\d{16,19})>$/.exec(value)
    const id = tag?.[3]
    const key = lookup(map.unicode, value) || lookup(map.legacyIds, value) || (id && lookup(map.legacyIds, id))
    return key ? assets.emoji(key) : tag ? {id: tag[3], name: tag[2], animated: Boolean(tag[1])} : value
  }
  function reaction(value) {
    const result = component(value)
    return result && typeof result === 'object' ? result.id || result.name : result
  }
  function plain(value) {
    if (typeof value !== 'string') return value
    const original = value
    const text = value.replace(pattern, '').trim()
    if (text) return text
    const key = lookup(map.unicode, original)
    if (key?.startsWith('icon.ordinal-')) return key.slice(13)
    return ({'icon.error':'Cancelar','icon.close':'Cancelar','icon.success':'Confirmar','icon.play':'Reproducir','icon.pause':'Pausar','icon.page-previous':'Anterior','icon.page-next':'Siguiente'})[key] || 'Acción'
  }
  // Preserve JavaScript interpolation expressions in inherited template catalogs. No evaluation here.
  function catalog(value) {
    if (typeof value !== 'string' || !value.startsWith('`') || !value.endsWith('`')) return owned(value)
    let result = '`', raw = '', i = 1
    while (i < value.length - 1) {
      if (value[i] === '\\') { raw += value.slice(i, i + 2); i += 2; continue }
      if (value[i] !== '$' || value[i + 1] !== '{') { raw += value[i++]; continue }
      result += owned(raw); raw = ''
      const start = i; i += 2; let depth = 1, quote = null
      while (i < value.length - 1 && depth) {
        const c = value[i++]
        if (c === '\\') { i++; continue }
        if (quote) { if (c === quote) quote = null; continue }
        if (['"', "'", '`'].includes(c)) { quote = c; continue }
        if (c === '{') depth++
        if (c === '}') depth--
      }
      const expression = value.slice(start, i)
      result += lookup(expressionOverrides, expression) || expression
    }
    return result + owned(raw) + '`'
  }
  function limit(value, length) {
    if (typeof value !== 'string' || value.length <= length) return value
    let out = value.slice(0, length - 1)
    if (/[\uD800-\uDBFF]$/.test(out)) out = out.slice(0, -1)
    const open = out.lastIndexOf('<'), close = out.lastIndexOf('>')
    if (open > close && /^<a?:/.test(out.slice(open))) out = out.slice(0, open)
    return out + '…'
  }
  function matchesReaction(actual, expected) {
    if (!actual) return false
    const e = component(expected), a = typeof actual === 'object' ? actual : {name: actual}
    return typeof e === 'object' ? (e.id ? a.id === e.id : a.name === e.name) : a.id === e || a.name === e
  }
  function gameComponent(value) {
    return value === '❌' ? assets.emoji('icon.game-cross') : value === '⭕' ? assets.emoji('icon.game-ring') : component(value)
  }
  return { owned, component, reaction, plain, catalog, markup, limit, matchesReaction, gameComponent, strip: value => typeof value === 'string' ? value.replace(pattern, '').trim() : value, image: key => assets.imageURL?.(key) || null }
}
module.exports = { ...createSystemEmoji(), createSystemEmoji, map }
