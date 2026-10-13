const { escapeMarkdown } = require('discord.js')

// Legacy language files contain template literals and some translated variable names.
// Expand only known fields; language text never executes JavaScript.
function membershipTitle(client, locale, kind, member, key) {
  const username = escapeMarkdown(String(member.user.tag || member.user.username || 'Miembro'))
  const guild = escapeMarkdown(String(member.guild.name || 'Tu comunidad'))
  const fallback = locale === 'en' ? `${kind === 'welcome' ? 'Welcome' : 'Goodbye'}, ${username}` : `${kind === 'welcome' ? 'Bienvenido' : 'Hasta pronto'}, ${username}`
  const template = client.la?.[locale]?.handlers?.[`${kind}js`]?.[kind]?.[key]
  if (typeof template !== 'string') return fallback.slice(0, 256)
  const values = { 'member.user.tag': username, 'member.user.username': username, 'member.guild.name': guild,
    'Miembro.Usuario.tag': username, 'Miembro.Usuario.username': username, 'Miembro.guild.name': guild }
  let valid = true
  const title = template.replace(/^`([\s\S]*)`$/, '$1').replace(/\$\{([^}]+)\}/g, (match, expression) => {
    if (!Object.hasOwn(values, expression)) { valid = false; return '' }
    return values[expression]
  })
  return (valid && title.trim() ? title : fallback).slice(0, 256).replace(/[\uD800-\uDBFF]$/, '')
}

module.exports = { membershipTitle }
