const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')
const { TOGGLE_GROUPS } = require('./setup-definitions')

const copy = (locale, key, variables) => t(locale, `setup.categories.${key}`, variables)
function buildToggleSetup(id, value, draft, locale, status = '') {
  const definition = TOGGLE_GROUPS[id], flags = Object.keys(definition.fields)
  const current = { ...value.values, ...draft }, enabled = flags.filter(key => definition.enabled(current[key]))
  const label = key => id === 'commands' ? key : t(locale, `setup.toggles.${id}.labels.${key}`)
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(id === 'commands' ? copy(locale, 'title') : t(locale, `setup.toggles.${id}.title`)).setDescription(id === 'commands' ? copy(locale, 'description') : t(locale, `setup.toggles.${id}.description`))
    .addFields({ name: copy(locale, 'enabled'), value: enabled.map(label).join(', ') || copy(locale, 'none') },
      { name: copy(locale, 'disabled'), value: flags.filter(key => !enabled.includes(key)).map(label).join(', ') || copy(locale, 'none') })
    .setFooter({ text: copy(locale, status || (Object.keys(draft).length ? 'unsaved' : 'current')) })
  const button = (id, text, style = ButtonStyle.Secondary, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, text)).setStyle(style).setDisabled(disabled)
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('categories_select')
    .setPlaceholder(copy(locale, 'choose')).setMinValues(0).setMaxValues(flags.length)
    .addOptions(flags.map(key => ({ label: label(key), value: key, default: enabled.includes(key) })))),
  new ActionRowBuilder().addComponents(button('categories_save', 'save', ButtonStyle.Primary, !Object.keys(draft).length),
    button('categories_discard', 'discard', ButtonStyle.Secondary, !Object.keys(draft).length), button('categories_close', 'close'))], allowedMentions: { parse: [], repliedUser: false } }
}
async function openToggleSetup(client, origin, id) {
  if (!Object.hasOwn(TOGGLE_GROUPS, id)) throw new Error('invalid_setup_definition')
  const definition = TOGGLE_GROUPS[id], flags = Object.keys(definition.fields)
  const authorize = definition.authorize
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const service = createSetupSettings(client.settings, definition.fields, () => Boolean(client._shuttingDown))
  const checkAccess = async () => { const access = await requireSetupAccess(client, context); await authorize?.(access, context) }
  let message
  try {
    await checkAccess()
    let value = await service.read(context.guildId), draft = {}
    const render = status => buildToggleSetup(id, value, draft, locale, status)
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, authorize, hasUnsavedChanges: () => Object.keys(draft).length > 0, controls: {
      categories_select: { accept: interaction => interaction.isStringSelectMenu(), async run(interaction) {
        if (!Array.isArray(interaction.values) || interaction.values.some(id => !flags.includes(id)) || new Set(interaction.values).size !== interaction.values.length) throw new Error('invalid_category')
        draft = Object.fromEntries(flags.map(key => [key, interaction.values.includes(key)]).filter(([id, enabled]) => enabled !== definition.enabled(value.values[id])))
        await interaction.editReply(render())
      } },
      categories_discard: { async run(interaction) { draft = {}; await interaction.editReply(render()) } },
      categories_save: { async run(interaction) {
        if (!Object.keys(draft).length) return
        let status = 'saved'
        try { value = await service.save(context.guildId, draft, value.revision); draft = {} }
        catch (error) {
          if (error.code !== 'setup_conflict') throw error
          await checkAccess()
          value = await service.read(context.guildId); status = 'conflict'
        }
        await interaction.editReply(render(status))
      } },
      categories_close: { async run(interaction, session) { await interaction.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}

const buildCategorySetup = (value, draft, locale, status) => buildToggleSetup('commands', value, draft, locale, status)
const openCategorySetup = (client, origin) => openToggleSetup(client, origin, 'commands')
module.exports = { buildCategorySetup, openCategorySetup, buildToggleSetup, openToggleSetup }
