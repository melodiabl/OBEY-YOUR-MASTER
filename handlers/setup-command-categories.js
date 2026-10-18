const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')
const { COMMAND_FLAGS, COMMAND_FIELDS } = require('./setup-definitions')

const copy = (locale, key, variables) => t(locale, `setup.categories.${key}`, variables)
function buildCategorySetup(value, draft, locale, status = '') {
  const current = { ...value.values, ...draft }, enabled = COMMAND_FLAGS.filter(id => current[id] !== false)
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, 'title')).setDescription(copy(locale, 'description'))
    .addFields({ name: copy(locale, 'enabled'), value: enabled.join(', ') || copy(locale, 'none') },
      { name: copy(locale, 'disabled'), value: COMMAND_FLAGS.filter(id => !enabled.includes(id)).join(', ') || copy(locale, 'none') })
    .setFooter({ text: copy(locale, status || (Object.keys(draft).length ? 'unsaved' : 'current')) })
  const button = (id, text, style = ButtonStyle.Secondary, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, text)).setStyle(style).setDisabled(disabled)
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('categories_select')
    .setPlaceholder(copy(locale, 'choose')).setMinValues(0).setMaxValues(COMMAND_FLAGS.length)
    .addOptions(COMMAND_FLAGS.map(id => ({ label: id, value: id, default: enabled.includes(id) })))),
  new ActionRowBuilder().addComponents(button('categories_save', 'save', ButtonStyle.Primary, !Object.keys(draft).length),
    button('categories_discard', 'discard', ButtonStyle.Secondary, !Object.keys(draft).length), button('categories_close', 'close'))], allowedMentions: { parse: [], repliedUser: false } }
}
async function openCategorySetup(client, origin) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const service = createSetupSettings(client.settings, COMMAND_FIELDS, () => Boolean(client._shuttingDown))
  let message
  try {
    await requireSetupAccess(client, context)
    let value = await service.read(context.guildId), draft = {}
    const render = status => buildCategorySetup(value, draft, locale, status)
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, controls: {
      categories_select: { accept: interaction => interaction.isStringSelectMenu(), async run(interaction) {
        if (!Array.isArray(interaction.values) || interaction.values.some(id => !COMMAND_FLAGS.includes(id)) || new Set(interaction.values).size !== interaction.values.length) throw new Error('invalid_category')
        draft = Object.fromEntries(COMMAND_FLAGS.map(id => [id, interaction.values.includes(id)]).filter(([id, enabled]) => enabled !== (value.values[id] !== false)))
        await interaction.editReply(render())
      } },
      categories_discard: { async run(interaction) { draft = {}; await interaction.editReply(render()) } },
      categories_save: { async run(interaction) {
        if (!Object.keys(draft).length) return
        let status = 'saved'
        try { value = await service.save(context.guildId, draft, value.revision); draft = {} }
        catch (error) {
          if (error.code !== 'setup_conflict') throw error
          await requireSetupAccess(client, context)
          value = await service.read(context.guildId); status = 'conflict'
        }
        await interaction.editReply(render(status))
      } },
      categories_close: { async run(interaction, session) { await interaction.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}

module.exports = { buildCategorySetup, openCategorySetup }
