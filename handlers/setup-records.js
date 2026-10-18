const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, escapeMarkdown } = require('discord.js')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')
const text = (value, locale) => typeof value === 'object' && value !== null ? value[locale] || value.en : value
const copy = (locale, key) => t(locale, `setup.records.${key}`)
function buildRecordsSetup(definition, records, selected, page, dirty, blocked, locale, status = '') {
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(text(definition.title, locale)).setDescription(copy(locale, 'description'))
    .addFields({ name: copy(locale, 'count'), value: String(records.length) })
    .setFooter({ text: copy(locale, status || (blocked ? 'conflict' : dirty ? 'unsaved' : 'current')) })
  if (records[selected]) embed.addFields({ name: copy(locale, 'selected'), value: escapeMarkdown(String(definition.describe(records[selected], locale))).slice(0, 1024) || copy(locale, 'empty') })
  const row = new ActionRowBuilder(), components = [], pages = Math.max(1, Math.ceil(records.length / 25))
  if (records.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('records_select').setPlaceholder(copy(locale, 'choose')).addOptions(records.slice(page * 25, page * 25 + 25).map((entry, index) => ({ value: String(page * 25 + index), label: String(definition.key(entry)).slice(0, 100) || '?', default: selected === page * 25 + index })))))
  const button = (id, key, disabled = false, style = ButtonStyle.Secondary) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, key)).setStyle(style).setDisabled(disabled)
  row.addComponents(button('records_new', 'add', blocked), button('records_edit', 'edit', blocked || !records[selected]), button('records_remove', 'remove', blocked || !records[selected]), button('records_save', 'save', blocked || !dirty, ButtonStyle.Primary))
  components.push(row, new ActionRowBuilder().addComponents(button('records_previous', 'previous', page === 0), button('records_next', 'next', page >= pages - 1), button('records_discard', blocked ? 'reload' : 'discard', !dirty && !blocked), button('records_close', 'close')))
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}
function recordModal(definition, record, locale) {
  return new ModalBuilder().setTitle(text(definition.title, locale).slice(0, 45)).addComponents(definition.inputs.map(input => {
    const value = input.format ? input.format(record?.[input.id], record) : record?.[input.id]
    const field = new TextInputBuilder().setCustomId(input.id).setLabel(text(input.label, locale).slice(0, 45)).setStyle(input.multiline ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(input.required !== false).setMaxLength(input.max || 2000)
    if (input.hint) field.setPlaceholder(text(input.hint, locale).slice(0, 100))
    if (value !== undefined && value !== null && value !== '' && String(value).length <= (input.max || 2000)) field.setValue(String(value))
    return new ActionRowBuilder().addComponents(field)
  }))
}
async function openRecordsSetup(client, origin, definition) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const service = createSetupSettings(client[definition.store], { records: { path: definition.path, default: [], schema: definition.schema } }, () => Boolean(client._shuttingDown), definition.defaults)
  let message
  try {
    await requireSetupAccess(client, context)
    let value = await service.read(context.guildId), records = structuredClone(value.values.records), selected = records.length ? 0 : -1, page = 0, dirty = false, blocked = false
    const render = status => buildRecordsSetup(definition, records, selected, page, dirty, blocked, locale, status)
    const invalid = i => i.followUp({ content: copy(locale, 'invalid'), ephemeral: true, allowedMentions: { parse: [] } })
    const edit = creating => ({ modal: () => {
      if (blocked || (!creating && !records[selected])) throw new Error('setup_invalid')
      return recordModal(definition, creating ? null : records[selected], locale)
    }, async run(i) {
      if (blocked) return invalid(i)
      const previous = creating ? null : records[selected]
      if (!creating && !previous) return invalid(i)
      let parsed
      try {
        parsed = definition.parse(Object.fromEntries(definition.inputs.map(input => [input.id, i.fields.getTextInputValue(input.id)])), previous)
        if (!definition.schema.element.safeParse(parsed).success || records.some((entry, index) => (creating || index !== selected) && String(definition.key(entry)).toLowerCase() === String(definition.key(parsed)).toLowerCase())) return invalid(i)
        const access = await requireSetupAccess(client, context)
        await definition.validate?.(parsed, access, client, previous)
      } catch { return invalid(i) }
      if (creating) { records.push(parsed); selected = records.length - 1 } else records[selected] = parsed
      page = Math.floor(selected / 25); dirty = true
      await i.editReply(render())
    } })
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, controls: {
      records_new: edit(true), records_edit: edit(false),
      records_select: { accept: i => i.isStringSelectMenu(), async run(i) { const index = Number(i.values?.[0]); if (i.values.length !== 1 || !Number.isInteger(index) || index < page * 25 || index >= page * 25 + 25 || !records[index]) throw new Error('setup_invalid'); selected = index; await i.editReply(render()) } },
      records_remove: { async run(i) { if (blocked || !records[selected]) return invalid(i); records.splice(selected, 1); selected = Math.min(selected, records.length - 1); page = Math.max(0, Math.min(page, Math.ceil(records.length / 25) - 1)); dirty = true; await i.editReply(render()) } },
      records_previous: { async run(i) { page = Math.max(0, page - 1); selected = Math.min(records.length - 1, page * 25); await i.editReply(render()) } },
      records_next: { async run(i) { page = Math.max(0, Math.min(Math.ceil(records.length / 25) - 1, page + 1)); selected = Math.min(records.length - 1, page * 25); await i.editReply(render()) } },
      records_discard: { async run(i) { await requireSetupAccess(client, context); value = await service.read(context.guildId); records = structuredClone(value.values.records); selected = records.length ? 0 : -1; page = 0; dirty = false; blocked = false; await i.editReply(render()) } },
      records_save: { async run(i, session) {
        if (blocked || !dirty) return
        const access = await requireSetupAccess(client, context)
        try { for (const entry of records) await definition.validate?.(entry, access, client, entry) } catch { return invalid(i) }
        if (!session.active()) return
        let status = 'saved'
        try { value = await service.save(context.guildId, { records }, value.revision); dirty = false }
        catch (error) { if (error.code !== 'setup_conflict') throw error; blocked = true; status = 'conflict' }
        await i.editReply(render(status))
      } },
      records_close: { async run(i, session) { await i.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}
module.exports = { openRecordsSetup, buildRecordsSetup, recordModal }
