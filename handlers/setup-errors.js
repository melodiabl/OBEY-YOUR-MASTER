const { t } = require('./i18n')

// Never log raw Discord/Mongo errors: they can contain tokens, IDs or document data.
function setupFailureNotice(locale, error, fallback, area) {
  const code = String(error?.code || error?.message || '')
  const known = ['setup_unavailable', 'setup_denied', 'setup_actor_permissions', 'setup_channel_access', 'setup_bot_permissions', 'setup_storage', 'language_storage']
  const storage = ['setup_storage', 'language_storage'].includes(code) ||
    [error, error?.cause, error?.errors?.[0]].some(value => /^(?:Mongo|Mongoose)/.test(value?.name || ''))
  const reason = known.includes(code) ? code : storage ? 'setup_storage' : /^\d{4,6}$/.test(code) ? `api_${code}` : 'unexpected'
  const kind = /^[A-Za-z]{1,40}$/.test(error?.name || '') ? error.name : 'Error'
  const frame = String(error?.stack || '').match(/(?:setup-[\w-]+|language-settings)\.js:\d+:\d+/)?.[0]
  console.warn(`[Setup] ${area}: ${reason} (${kind})${frame ? ` at ${frame}` : ''}`)
  let key
  if (['setup_denied', 'setup_actor_permissions', 'setup_channel_access'].includes(code) || ['50001', '10003', '10007'].includes(code)) key = 'accessDenied'
  else if (code === 'setup_bot_permissions' || code === '50013') key = 'botPermissions'
  else if (storage) key = 'storageUnavailable'
  else if (code === 'setup_unavailable') key = 'starting'
  return key ? { ...fallback, content: t(locale, `setup.editor.${key}`) } : fallback
}

module.exports = { setupFailureNotice }
