const { registry } = require('../assets/registry')
const { createSystemEmoji } = require('../assets/system')
// Normalize only bot-owned catalog text, preserving interpolation expressions and user values.
function normalizeLegacyText(text, assets = registry) {
  return createSystemEmoji(assets).catalog(text)
}
function prepareLegacyCatalog(base, localized, assets = registry) {
  if (typeof base === 'string' || typeof localized === 'string') return normalizeLegacyText(typeof localized === 'string' ? localized : base, assets)
  if (!base || typeof base !== 'object' || Array.isArray(base)) return localized ?? base
  const result = {}
  const override = localized && typeof localized === 'object' && !Array.isArray(localized) ? localized : {}
  for (const key of new Set([...Object.keys(base), ...Object.keys(override)])) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) continue
    result[key] = prepareLegacyCatalog(base[key], override[key], assets)
  }
  return result
}
module.exports = { normalizeLegacyText, prepareLegacyCatalog }
