const { createPrefixSettings } = require('./prefix-settings')
const { LANGUAGES, createLanguageSettings } = require('./language-settings')
const { createSetupSettings, SetupSettingsError } = require('./setup-settings')
const { createCommandCategorySettings, commandCategoryEnabled } = require('./command-category-settings')
const { logSetupDefinition } = require('./setup-logs')
const { CATEGORIES, resolveLogDestination } = require('./logs/policy')
const { welcomeConfiguration } = require('./welcome-configuration')

const guildIdPattern = /^[a-zA-Z0-9_:-]{1,100}$/
const validRoleId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)
const languageLabel = code => LANGUAGES.find(item => item.code === code)?.name || String(code)
const roleList = value => Array.isArray(value) ? value.filter(validRoleId) : []

function createConfigurationSummary(client) {
  const settings = client.settings
  const isStopping = () => Boolean(client._shuttingDown || client._dbReady === false)
  const normalize = error => {
    if (error?.code === 'invalid_setup' || error instanceof SetupSettingsError || error?.code === 'language_storage') throw error
    const storage = new SetupSettingsError('setup_storage')
    storage.cause = error
    throw storage
  }
  return {
    async read(guildId) {
      if (typeof guildId !== 'string' || !guildIdPattern.test(guildId)) throw new SetupSettingsError('invalid_setup')
      try {
        const [prefix, language, music, logValues, welcome] = await Promise.all([
          createPrefixSettings(client).read(guildId),
          createLanguageSettings(settings, isStopping).read(guildId),
          createCommandCategorySettings(client).read(guildId),
          createSetupSettings(settings, logSetupDefinition().fields, isStopping).read(guildId),
          welcomeConfiguration(settings).read(guildId),
        ])
        const persisted = await settings.exclusive(async () => {
          return (await settings.model.findOne({ [settings.guildKey]: guildId }).lean()) || {}
        })
        const logSettings = {
          logger: { channel: logValues.values.defaultChannel },
          logChannels: Object.fromEntries(CATEGORIES.map(category => [category, logValues.values[category]])),
        }
        return {
          prefix: prefix.values.prefix,
          prefixRevision: prefix.revision,
          language: language.language,
          languageLabel: languageLabel(language.language),
          languageRevision: language.revision,
          music: { enabled: commandCategoryEnabled(music.values.MUSIC), configured: music.present.MUSIC, revision: music.revision },
          logs: {
            defaultChannel: logValues.values.defaultChannel === 'no' ? null : logValues.values.defaultChannel,
            routing: Object.fromEntries(CATEGORIES.map(category => [category, resolveLogDestination(logSettings, category)])),
            revision: logValues.revision,
          },
          welcome: { channelId: welcome.channelId, message: welcome.message, revision: welcome.revision },
          adminRoles: roleList(persisted.adminroles),
          autoroles: roleList(persisted.welcome?.roles),
        }
      } catch (error) {
        normalize(error)
      }
    },
  }
}

module.exports = { createConfigurationSummary }
