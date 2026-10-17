// @ts-check
const { configJsonSchema } = require('./contract')
const { t, catalogs } = require('../i18n')

// Layout and copy references only. Field constraints belong to contract.js.
const welcomeUi = {
  sections: [{ id: 'delivery', titleKey: 'welcome.settings.delivery', fields: [
    { path: 'channelId', id: 'config-channel', component: 'guild-text-channel', labelKey: 'welcome.settings.channel', helpKey: 'welcome.settings.channelHelp' },
    { path: 'message', id: 'config-message', component: 'message-template', labelKey: 'welcome.settings.message', helpKey: 'welcome.settings.messageHelp' },
  ] }],
}

/** @param {string} locale */
function welcomeSettingsForm(locale) {
  const variables = { user: '{user}', usertag: '{usertag}', username: '{username}', guild: '{guild}', server: '{server}', count: '{count}',
    revision: '{revision}', channel: '{channel}', message: '{message}', date: '{date}', before: '{before}', after: '{after}' }
  const message = configJsonSchema.properties?.message
  if (!message || typeof message !== 'object' || typeof message.maxLength !== 'number') throw new Error('Invalid welcome message contract')
  const copyVariables = { ...variables, limit: message.maxLength }
  return {
    locale,
    messages: Object.fromEntries(Object.keys(catalogs.es.welcome.editor).map(key => [key, t(locale, `welcome.editor.${key}`, copyVariables)])),
    sections: welcomeUi.sections.map(section => ({ id: section.id, title: t(locale, section.titleKey), fields: section.fields.map(field => {
      const schema = configJsonSchema.properties?.[field.path]
      if (!schema || typeof schema !== 'object') throw new Error('Unknown welcome form field')
      const nullable = Boolean(schema.anyOf?.some(option => typeof option === 'object' && option.type === 'null'))
      if (field.component === 'guild-text-channel' && !nullable || field.component === 'message-template' && schema.type !== 'string') throw new Error('Incompatible welcome form component')
      return { ...field, nullable, maxLength: schema.maxLength, label: t(locale, field.labelKey), help: t(locale, field.helpKey, copyVariables) }
    }) })),
  }
}

module.exports = { welcomeUi, welcomeSettingsForm }
