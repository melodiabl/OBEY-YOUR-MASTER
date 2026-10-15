const catalogs = { es: require('../../locales/es.json'), en: require('../../locales/en.json') }
function normalizeLocale(locale) { return String(locale || 'es').toLowerCase().split(/[-_]/)[0] }
function lookup(catalog, key) {
  let value = catalog
  for (const part of String(key).split('.')) {
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, part)) return undefined
    value = value[part]
  }
  return typeof value === 'string' ? value : undefined
}
function t(locale, key, variables = {}) {
  const value = lookup(catalogs[normalizeLocale(locale)], key) ?? lookup(catalogs.es, key)
  if (value === undefined) throw new Error(`Unknown translation key: ${key}`)
  return value.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name) => {
    if (!Object.hasOwn(variables, name)) throw new Error(`Missing translation variable: ${key}/${name}`)
    return String(variables[name])
  })
}
function localeFor(client, guildId) {
  return client?.settings?.get?.(guildId, 'language') || client?.guilds?.cache?.get?.(guildId)?.preferredLocale || 'es'
}
module.exports = { catalogs, normalizeLocale, t, localeFor }
