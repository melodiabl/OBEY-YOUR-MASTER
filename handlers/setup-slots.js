const { setupFailureNotice } = require('./setup-errors')
const { openSetupChoices } = require('./setup-choices')
const { requireSetupAccess } = require('./setup-access')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { label } = require('./setup-fields')

// Existing numbered stores remain authoritative. Choosing a free slot writes nothing.
async function openSetupSlots(client, origin, definition) {
  const { title, store, prefix, isUsed, open } = definition
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  try {
    await requireSetupAccess(client, context)
    const repository = client[store]
    const numbers = Array.from({ length: 100 }, (_, index) => index + 1)
    const projection = Object.fromEntries(numbers.map(n => [prefix + n, 1]))
    const doc = await repository.exclusive(() => repository.model.findOne({ [repository.guildKey]: context.guildId }, projection).lean()) || {}
    await requireSetupAccess(client, context)
    const used = numbers.filter(n => isUsed(doc[prefix + n] || {})), free = numbers.find(n => !used.includes(n))
    const choice = n => {
      const name = doc[prefix + n]?.panelTitle
      return { id: String(n), title: typeof name === 'string' && name.trim() ? label(`${name.slice(0, 80)} · ${n}`, `${name.slice(0, 80)} · ${n}`) : label(`Configuración ${n}`, `Setup ${n}`), description: used.includes(n) ? label('Ya tiene ajustes: revisar o modificar.', 'Already configured: review or edit.') : label('Espacio disponible; no se crea nada al abrir.', 'Available slot; opening it creates nothing.'), open: (c, m) => open(c, m, n) }
    }
    const choices = [...(free ? [{ id: 'new', title: label('Preparar uno nuevo', 'Set up a new one'), description: label('Empieza con los ajustes básicos.', 'Start with the basic settings.'), open: (c, m) => open(c, m, free) }] : []),
      ...used.map(choice),
      { id: 'all', title: label('Ver todos los espacios', 'View all slots'), description: label('Avanzado: acceder a las 100 configuraciones numeradas.', 'Advanced: access all 100 numbered setups.'), open: (c, m) => openSetupChoices(c, m, title, numbers.map(choice)) }]
    return openSetupChoices(client, origin, title, choices, {
      description: label('Empieza con uno nuevo o revisa uno de los que ya tienen ajustes. Abrir una opción no guarda ni publica nada.', 'Start a new setup or review an existing one. Opening an option does not save or publish anything.'),
      reload: nextOrigin => openSetupSlots(client, nextOrigin, definition),
    })
  } catch (error) {
    await origin.reply(setupFailureNotice(locale, error, { content: t(locale, 'setup.editor.unavailable'), embeds: [], components: [], allowedMentions: { parse: [] } }, 'setup-slots/open'))
  }
}

module.exports = { openSetupSlots }
