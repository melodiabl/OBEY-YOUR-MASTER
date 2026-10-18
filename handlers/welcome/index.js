// @ts-check
// Public configuration API. Persistence and Discord policy are wired by composition.
const { createWelcomeService } = require('./service')
const { ConfigurationError } = require('./error')
const { configSchema, configJsonSchema } = require('./contract')
const { welcomeSettingsForm } = require('./ui')

module.exports = { createWelcomeService, ConfigurationError, configSchema, configJsonSchema, welcomeSettingsForm }
