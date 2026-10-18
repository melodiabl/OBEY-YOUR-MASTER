const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { t } = require('./i18n')

const BACK = Symbol('setupBack')
const returnToSetup = source => source[BACK]

function withBackButton(payload, back, locale) {
  if (!back || !payload.components?.length) return payload
  const components = payload.components.map(row => ActionRowBuilder.from(row))
  if (components.some(row => row.components.some(component => component.data.custom_id === 'setup_back'))) return payload
  const button = new ButtonBuilder().setCustomId('setup_back').setLabel(t(locale, 'setup.form.back')).setStyle(ButtonStyle.Secondary)
  const row = [...components].reverse().find(row => row.components.length < 5 && row.components.every(component => component.data.type === 2))
  if (row) row.addComponents(button)
  else components.push(new ActionRowBuilder().addComponents(button))
  if (components.length > 5) throw new Error('setup_component_limit')
  return { ...payload, components }
}

// Reuse the original command context, while keeping every screen on one message.
function setupOrigin(origin, message, back = returnToSetup(origin), locale = 'es') {
  const next = Object.create(origin)
  Object.defineProperties(next, {
    [BACK]: { value: back },
    reply: { value: async payload => {
      await message.edit({ content: '', embeds: [], components: [], attachments: [], ...withBackButton(payload, back, locale) })
      message[BACK] = back
      return message
    } },
  })
  return next
}

function setupInteraction(interaction, back, locale) {
  if (!back) return interaction
  return new Proxy(interaction, { get(target, key) {
    if (key === 'editReply') return payload => target.editReply(withBackButton(payload, back, locale))
    const value = Reflect.get(target, key, target)
    return typeof value === 'function' ? value.bind(target) : value
  } })
}

module.exports = { setupOrigin, returnToSetup, withBackButton, setupInteraction }
