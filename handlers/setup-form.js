const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, MentionableSelectMenuBuilder,
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits: F, escapeMarkdown } = require('discord.js')
const { isDeepStrictEqual: equal } = require('node:util')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')

const copy = (locale, key, vars) => t(locale, `setup.form.${key}`, vars)
const text = (value, locale) => typeof value === 'object' && value !== null ? value[locale] || value.en : value
const row = component => new ActionRowBuilder().addComponents(component)
function display(field, value, locale) {
  if (field.type === 'enum' && field.labels?.[value]) return text(field.labels[value], locale)
  if (field.format) return String(field.format(value, locale)).slice(0, 1024) || copy(locale, 'empty')
  if (typeof value === 'boolean') return copy(locale, value ? 'enabled' : 'disabled')
  if (value === null || value === undefined || value === '') return copy(locale, 'empty')
  if (Array.isArray(value)) return value.length ? value.map(item => escapeMarkdown(String(item))).join('\n').slice(0, 1000) + (JSON.stringify(value).length > 1000 ? '\n…' : '') : copy(locale, 'empty')
  if (field.type === 'duration' && Number.isFinite(value)) return `${value} ms`
  return escapeMarkdown(String(value)).slice(0, 1024)
}
function buildFormSetup(definition, value, draft, selected, locale, status = '') {
  const fields = definition.fields, keys = Object.keys(fields), field = fields[selected], current = { ...value.values, ...draft }
  const fieldLabel = id => text(fields[id].label, locale)
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(text(definition.title, locale)).setDescription(text(definition.description, locale) || copy(locale, 'description'))
    .addFields({ name: fieldLabel(selected), value: text(field.hint, locale) || copy(locale, 'selected') },
      { name: copy(locale, 'current'), value: display(field, value.values[selected], locale), inline: true },
      { name: copy(locale, 'pending'), value: Object.hasOwn(draft, selected) ? display(field, draft[selected], locale) : copy(locale, 'unchanged'), inline: true })
    .setFooter({ text: copy(locale, status || (Object.keys(draft).length ? 'unsaved' : 'savedStatus')) })
  if (definition.preview) embed.addFields({ name: copy(locale, 'preview'), value: String(definition.preview(current, locale)).slice(0, 1024) || copy(locale, 'empty') })
  const components = [row(new StringSelectMenuBuilder().setCustomId('form_field').setPlaceholder(copy(locale, 'choose')).addOptions(keys.slice(Math.floor(keys.indexOf(selected) / 25) * 25, Math.floor(keys.indexOf(selected) / 25) * 25 + 25).map(id => ({ label: fieldLabel(id), value: id, default: id === selected }))))]
  if (field.type === 'boolean' || field.type === 'enum') components.push(row(new StringSelectMenuBuilder().setCustomId('form_value').setPlaceholder(copy(locale, 'value')).addOptions((field.type === 'boolean' ? [true, false] : field.options).map(option => ({ label: field.type === 'boolean' ? copy(locale, option ? 'enabled' : 'disabled') : text(field.labels?.[option], locale) || String(option), value: String(option), default: current[selected] === option })))))
  if (['channel', 'channels', 'role', 'roles', 'principals'].includes(field.type)) {
    const multiple = field.type.endsWith('s'), channels = field.type.startsWith('channel')
    const select = channels ? new ChannelSelectMenuBuilder().setChannelTypes(...(field.channelTypes || [ChannelType.GuildText, ChannelType.GuildAnnouncement, ...(multiple ? [ChannelType.GuildCategory] : [])])) : field.type === 'principals' ? new MentionableSelectMenuBuilder() : new RoleSelectMenuBuilder()
    components.push(row(select.setCustomId('form_resource').setPlaceholder(copy(locale, multiple ? 'addResources' : 'chooseResource')).setMinValues(multiple ? 1 : 0).setMaxValues(multiple ? 25 : 1)))
  }
  const button = (id, label, style = ButtonStyle.Secondary, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, label)).setStyle(style).setDisabled(disabled)
  const edits = []
  if (!['boolean', 'enum', 'channel', 'channels', 'role', 'roles', 'principals'].includes(field.type)) edits.push(button('form_edit', field.type === 'list' || field.removable ? 'add' : 'edit'))
  if ((['channels', 'roles', 'principals', 'list'].includes(field.type) || field.removable)) edits.push(button('form_remove', 'remove', ButtonStyle.Secondary, !current[selected] || !Object.keys(current[selected]).length))
  if (field.clear !== undefined) edits.push(button('form_clear', 'clear'))
  if (edits.length) components.push(new ActionRowBuilder().addComponents(edits))
  components.push(new ActionRowBuilder().addComponents(button('form_save', 'save', ButtonStyle.Primary, !Object.keys(draft).length), button('form_discard', 'discard', ButtonStyle.Secondary, !Object.keys(draft).length), button('form_close', 'close'), ...(definition.previewAction ? [button('form_preview', 'preview')] : [])))
  if (definition.publish) components.push(new ActionRowBuilder().addComponents(button('form_publish', 'publish', ButtonStyle.Primary, Boolean(Object.keys(draft).length)), ...(definition.unpublish ? [button('form_unpublish', 'unpublish', ButtonStyle.Secondary, Boolean(Object.keys(draft).length))] : [])))
  if (keys.length > 25) components.push(new ActionRowBuilder().addComponents(button('form_previous', 'previous', ButtonStyle.Secondary, keys.indexOf(selected) < 25), button('form_next', 'next', ButtonStyle.Secondary, keys.indexOf(selected) >= Math.floor((keys.length - 1) / 25) * 25)))
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}
function createFieldModal(field, value, locale, removing = false) {
  const list = ['list', 'channels', 'roles', 'principals'].includes(field.type) || field.removable
  const maxInput = Math.min(4000, Math.max(field.maxInput || 4000, !list && value !== undefined && value !== null ? String(value).length : 0))
  const input = new TextInputBuilder().setCustomId('value').setLabel(text(field.label, locale).slice(0, 45)).setStyle(TextInputStyle.Paragraph)
    .setRequired(!field.allowEmpty).setMaxLength(maxInput)
    .setPlaceholder(copy(locale, list ? (removing ? 'removeHint' : 'listHint') : field.type === 'duration' ? 'durationHint' : 'inputHint'))
  if (!list && value !== undefined && value !== null && typeof value !== 'object') input.setValue(String(value))
  return new ModalBuilder().setTitle(text(field.label, locale).slice(0, 45)).addComponents(row(input))
}
function parseFieldInput(field, input, previous, removing = false) {
  if (field.parse) return field.parse(input, previous, removing)
  if (['list', 'channels', 'roles', 'principals'].includes(field.type) || field.removable) {
    const items = input.split(/\r?\n/).map(value => value.trim()).filter(Boolean), old = Array.isArray(previous) ? previous : []
    return removing ? old.filter(value => !items.includes(value)) : [...new Set([...old, ...items])]
  }
  if (field.type === 'number') return input.trim() ? Number(input) : NaN
  if (field.type === 'duration') {
    if (/^\d+$/.test(input.trim())) return Number(input.trim())
    const ms = require('ms'), parts = input.split('+').map(value => ms(value.trim()))
    return parts.length && parts.every(value => Number.isFinite(value)) ? parts.reduce((a, b) => a + b, 0) : NaN
  }
  return input
}
async function checkResources(access, field, value) {
  if (!['channel', 'channels', 'role', 'roles', 'principals'].includes(field.type)) return
  const multiple = field.type.endsWith('s'), channels = field.type.startsWith('channel'), ids = multiple ? value : [value]
  for (const id of ids) {
    if (!id || id === 'no' || id === 'nochannel') continue
    if (channels) {
      const resource = await access.guild.channels.fetch(id)
      if (!resource || resource.guildId !== access.guild.id || !(field.channelTypes || [0, 5, ...(multiple ? [4] : [])]).includes(resource.type) || !resource.permissionsFor(access.member)?.has(F.ViewChannel) || !resource.permissionsFor(access.bot)?.has(field.send === false || (multiple && field.send !== true) ? [F.ViewChannel] : [F.ViewChannel, F.SendMessages, F.EmbedLinks])) throw new Error('setup_resource')
    } else {
      if (field.type === 'principals') {
        const roles = await access.guild.roles.fetch()
        if (roles.has(id)) continue
        const member = await access.guild.members.fetch({ user: id, force: true })
        if (member?.guild.id !== access.guild.id || member.id !== id) throw new Error('setup_resource')
        continue
      }
      const resource = await access.guild.roles.fetch(id)
      if (!resource || resource.guild.id !== access.guild.id || resource.id === access.guild.id && !field.allowEveryone || (!field.permissionOnly && (resource.managed || !access.bot.permissions.has(F.ManageRoles) || resource.comparePositionTo(access.bot.roles.highest) >= 0 || (field.noAdmin && resource.permissions.has(F.Administrator))))) throw new Error('setup_resource')
    }
  }
}
async function openFormSetup(client, origin, definition) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const keys = Object.keys(definition.fields)
  if (!keys.length) throw new Error('invalid_setup_definition')
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  let service
  const checkAccess = async () => { const access = await requireSetupAccess(client, context); await definition.authorize?.(access, context); return access }
  let message
  try {
    await checkAccess()
    service = definition.service ? definition.service(client, context) : createSetupSettings(client[definition.store || 'settings'], definition.fields, () => Boolean(client._shuttingDown), definition.defaults)
    let value = await service.read(context.guildId), draft = {}, selected = keys[0]
    const current = () => ({ ...value.values, ...draft }), field = () => definition.fields[selected]
    const render = status => buildFormSetup(definition, value, draft, selected, locale, status)
    async function change(interaction, input) {
      const parsed = field().schema.safeParse(input)
      if (!parsed.success) { await interaction.followUp({ content: copy(locale, 'invalid', { field: text(field().label, locale) }), ephemeral: true, allowedMentions: { parse: [] } }); return }
      if (equal(value.values[selected], parsed.data)) delete draft[selected]; else draft[selected] = parsed.data
      await interaction.editReply(render())
    }
    const modalControl = removing => ({ modal: () => createFieldModal(field(), current()[selected], locale, removing), async run(interaction) {
      if (removing && !['list', 'channels', 'roles', 'principals'].includes(field().type) && !field().removable) throw new Error('invalid_field')
      if (!removing && ['boolean', 'enum', 'channel', 'channels', 'role', 'roles', 'principals'].includes(field().type)) throw new Error('invalid_field')
      let input
      try { input = parseFieldInput(field(), interaction.fields.getTextInputValue('value'), current()[selected], removing) } catch { input = undefined }
      await change(interaction, input)
    } })
    const publish = removing => ({ async run(i, session) {
      if (Object.keys(draft).length) { await i.followUp({ content: copy(locale, 'saveFirst'), ephemeral: true, allowedMentions: { parse: [] } }); return }
      const action = removing ? definition.unpublish : definition.publish
      if (!action) throw new Error('invalid_setup_definition')
      let status = removing ? 'unpublished' : 'published'
      try { await action(client, { ...context, isActive: session.active }) } catch (error) { status = error.code === 'publication_uncertain' ? 'publicationUncertain' : 'publishFailed' }
      if (!session.active() || client._shuttingDown) return
      await checkAccess()
      value = await service.read(context.guildId)
      await i.editReply(render())
      await i.followUp({ content: copy(locale, status), ephemeral: true, allowedMentions: { parse: [] } })
    } })
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, authorize: definition.authorize, controls: {
      form_field: { accept: i => i.isStringSelectMenu(), async run(i) { if (i.values.length !== 1 || !keys.includes(i.values[0])) throw new Error('invalid_field'); selected = i.values[0]; await i.editReply(render()) } },
      form_previous: { async run(i) { selected = keys[Math.max(0, Math.floor(keys.indexOf(selected) / 25) * 25 - 25)]; await i.editReply(render()) } },
      form_next: { async run(i) { selected = keys[Math.min(keys.length - 1, Math.floor(keys.indexOf(selected) / 25) * 25 + 25)]; await i.editReply(render()) } },
      form_value: { accept: i => i.isStringSelectMenu(), async run(i) { if (i.values.length !== 1 || !['boolean', 'enum'].includes(field().type)) throw new Error('invalid_field'); await change(i, field().type === 'boolean' ? (i.values[0] === 'true' ? true : i.values[0] === 'false' ? false : null) : i.values[0]) } },
      form_resource: { accept: i => i.isChannelSelectMenu() || i.isRoleSelectMenu() || i.isMentionableSelectMenu(), async run(i) {
        if (!['channel', 'channels', 'role', 'roles', 'principals'].includes(field().type) || field().type.startsWith('channel') !== i.isChannelSelectMenu() || (field().type === 'principals') !== i.isMentionableSelectMenu()) throw new Error('invalid_field')
        const multiple = field().type.endsWith('s')
        if (!Array.isArray(i.values) || i.values.length > (multiple ? 25 : 1)) throw new Error('invalid_field')
        await change(i, multiple ? [...new Set([...(current()[selected] || []), ...i.values])] : i.values[0] || field().clear)
      } },
      form_edit: modalControl(false), form_remove: modalControl(true),
      form_clear: { async run(i) { if (field().clear === undefined) throw new Error('invalid_field'); await change(i, structuredClone(field().clear)) } },
      form_discard: { async run(i) { draft = {}; await i.editReply(render()) } },
      form_save: { async run(i, session) {
        if (!Object.keys(draft).length) return
        const access = await checkAccess()
        try {
          if (definition.prepare) {
            const prepared = await definition.prepare(current(), structuredClone(draft), access, client)
            for (const [id, input] of Object.entries(prepared)) { if (!Object.hasOwn(definition.fields, id)) throw new Error('invalid_setup'); const parsed = definition.fields[id].schema.safeParse(input); if (!parsed.success) throw new Error('invalid_setup'); draft[id] = parsed.data }
          }
          if (!session.active()) return
          for (const id of Object.keys(draft)) await checkResources(access, definition.fields[id], draft[id])
          await definition.validate?.(current(), access)
        }
        catch { if (session.active()) await i.followUp({ content: text(definition.invalid, locale) || copy(locale, 'resource'), ephemeral: true, allowedMentions: { parse: [] } }); return }
        await checkAccess()
        if (!session.active()) return
        let status = 'saved'
        try { value = await service.save(context.guildId, draft, value.revision); draft = {} }
        catch (error) { if (error.code !== 'setup_conflict') throw error; await checkAccess(); value = await service.read(context.guildId); status = 'conflict' }
        await i.editReply(render(status))
      } },
      form_publish: publish(false), form_unpublish: publish(true),
      form_preview: { async run(i, session) {
        if (!definition.previewAction) throw new Error('invalid_field')
        let payload
        try { payload = await definition.previewAction(client, context, structuredClone(current())) }
        catch { if (session.active()) await i.followUp({ content: copy(locale, 'previewFailed'), ephemeral: true, allowedMentions: { parse: [] } }); return }
        await checkAccess()
        if (session.active()) await i.followUp({ ...payload, ephemeral: true, allowedMentions: { parse: [] } })
      } },
      form_close: { async run(i, session) { await i.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}
module.exports = { openFormSetup, buildFormSetup, parseFieldInput, checkResources }
