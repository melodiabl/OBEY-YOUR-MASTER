const { setupFailureNotice } = require('./setup-errors')
const { randomBytes } = require('node:crypto')
const { InteractionCollector, InteractionType } = require('discord.js')
const { requireSetupAccess } = require('./setup-access')
const { returnToSetup, setupInteraction } = require('./setup-flow')
const { t, localeFor, normalizeLocale } = require('./i18n')

// Owns only message/modal resources. Each setup owns its state, validation and writes.
function attachSetupSession(client, message, context, { controls, notice, onError, authorize, hasUnsavedChanges = () => false }) {
  const back = returnToSetup(message)
  const locale = () => normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  if (back) controls = { ...controls, setup_back: { async run(interaction, session) {
    if (hasUnsavedChanges()) {
      await interaction.followUp({ content: t(locale(), 'setup.form.saveBeforeBack'), ephemeral: true, allowedMentions: { parse: [] } })
      return
    }
    await interaction.editReply({ components: [] })
    session.close('back')
    await back()
  } } }
  const collector = message.createMessageComponentCollector({ time: 180000, idle: 90000 })
  const children = new Set()
  let closed = false, version = 0, queue = Promise.resolve()
  const active = () => !closed
  function enqueue(interaction, run, expectedVersion) {
    let acknowledged
    try { acknowledged = Promise.resolve(interaction.deferUpdate()).then(() => true, () => false) } catch { return }
    queue = queue.then(async () => {
      if (!await acknowledged || closed) return
      if (expectedVersion !== undefined && version !== expectedVersion) {
        await interaction.followUp({ ...notice('staleForm'), ephemeral: true })
        return
      }
      const access = await requireSetupAccess(client, context)
      await authorize?.(access, context)
      if (closed) return
      await run(setupInteraction(interaction, back, locale()), { active, close: reason => collector.stop(reason) })
      version++
    }).catch(async error => {
      if (closed) return
      if (await onError?.(error, interaction)) return
      collector.stop('unavailable')
      await message.edit(setupFailureNotice(locale(), error, notice('unavailable'), 'setup-session/control')).catch(() => {})
    }).catch(() => { collector.stop('unavailable') })
  }
  collector.on('collect', interaction => {
    const control = Object.hasOwn(controls, interaction.customId) ? controls[interaction.customId] : null
    if (closed || interaction.user.id !== context.actorId || interaction.guildId !== context.guildId || interaction.message?.id !== message.id || !control ||
      !(control.accept ? control.accept(interaction) : interaction.isButton())) {
      void interaction.reply({ ...notice('notYours'), ephemeral: true }).catch(() => {})
      return
    }
    if (control.modal) {
      // Opening a local form needs the initial interaction response, before any I/O.
      const formId = 'setup_form_' + randomBytes(12).toString('hex'), openedAt = version
      let child
      try {
        const modal = control.modal()
        if (!modal) { enqueue(interaction, control.run); return }
        modal.setCustomId(formId)
        child = new InteractionCollector(client, { interactionType: InteractionType.ModalSubmit, time: 90000, max: 1,
          filter: value => value.customId === formId && value.user.id === context.actorId && value.guildId === context.guildId && value.message?.id === message.id })
        children.add(child)
        child.once('end', () => children.delete(child))
        child.on('collect', value => enqueue(value, control.run, openedAt))
        void Promise.resolve(interaction.showModal(modal)).catch(() => child.stop('unavailable'))
      } catch { child?.stop('unavailable'); void interaction.reply({ ...notice('unavailable'), ephemeral: true }).catch(() => {}) }
      return
    }
    enqueue(interaction, control.run)
  })
  collector.on('end', (_, reason) => {
    closed = true
    for (const child of children) child.stop('parentClosed')
    if (!['selected', 'back'].includes(reason)) queue = queue.then(() => message.edit(['idle', 'time'].includes(reason) ? notice('expired') : { components: [] })).catch(() => {})
  })
  return collector
}

module.exports = { attachSetupSession }
