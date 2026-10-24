const { createSetupSettings } = require('./setup-settings')
const { TOGGLE_GROUPS } = require('./setup-definitions')

function createCommandCategorySettings(client) {
  return createSetupSettings(client.settings, TOGGLE_GROUPS.commands.fields,
    () => Boolean(client._shuttingDown || client._dbReady === false))
}

const commandCategoryEnabled = value => TOGGLE_GROUPS.commands.enabled(value)

module.exports = { createCommandCategorySettings, commandCategoryEnabled }
