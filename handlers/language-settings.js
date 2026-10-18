const { createHash } = require('node:crypto')

const LANGUAGES = Object.freeze([
  Object.freeze({ code: 'es', name: 'Español' }), Object.freeze({ code: 'en', name: 'English' }),
  Object.freeze({ code: 'de', name: 'Deutsch' }), Object.freeze({ code: 'in', name: 'हिन्दी' }),
])
class LanguageSettingsError extends Error { constructor(code) { super(code); this.code = code } }
const fail = code => { throw new LanguageSettingsError(code) }
function snapshot(doc = {}) {
  const present = Object.hasOwn(doc, 'language'), language = present ? doc.language : 'es'
  if (typeof language !== 'string' || !language.length || language.length > 100) fail('language_storage')
  return { language, revision: createHash('sha256').update(JSON.stringify([present, language])).digest('hex') }
}

function createLanguageSettings(settings, isStopping = () => false) {
  const check = guildId => {
    if (isStopping()) fail('language_unavailable')
    if (typeof guildId !== 'string' || !/^[a-zA-Z0-9_:-]{1,100}$/.test(guildId)) fail('language_invalid')
  }
  const stored = guildId => settings.model.findOne({ [settings.guildKey]: guildId }).lean()
  function publish(guildId, doc, cachedBefore) {
    // A newer legacy write can update cache while its persistence waits in the queue.
    if (doc && Object.hasOwn(doc, 'language') && settings.get(guildId, 'language') === cachedBefore) settings.patchCached(guildId, { language: doc.language })
  }
  async function storage(operation) {
    try { return await operation() }
    catch (error) {
      if (error instanceof LanguageSettingsError) throw error
      fail(error.code === 11000 ? 'language_conflict' : 'language_storage')
    }
  }
  return {
    read(guildId) {
      check(guildId)
      return storage(() => settings.exclusive(async () => {
        const cachedBefore = settings.get(guildId, 'language'), doc = await stored(guildId), value = snapshot(doc || {})
        publish(guildId, doc, cachedBefore)
        return value
      }))
    },
    save(guildId, language, expectedRevision) {
      check(guildId)
      if (!LANGUAGES.some(item => item.code === language) || typeof expectedRevision !== 'string' || !/^[a-f0-9]{64}$/.test(expectedRevision)) fail('language_invalid')
      // Enter the existing write queue synchronously so database flush includes accepted saves.
      return storage(() => settings.exclusive(async () => {
        const cachedBefore = settings.get(guildId, 'language'), doc = await stored(guildId), before = snapshot(doc || {})
        if (before.revision !== expectedRevision) fail('language_conflict')
        if (doc?.language === language) { publish(guildId, doc, cachedBefore); return before }
        const filter = { [settings.guildKey]: guildId, language: doc && Object.hasOwn(doc, 'language') ? { $eq: doc.language } : { $exists: false } }
        const saved = await settings.model.findOneAndUpdate(filter, { $set: { language } }, { new: true, upsert: !doc, setDefaultsOnInsert: false }).lean()
        if (!saved) fail('language_conflict')
        publish(guildId, saved, cachedBefore)
        return snapshot(saved)
      }))
    },
  }
}

module.exports = { LANGUAGES, LanguageSettingsError, createLanguageSettings }
