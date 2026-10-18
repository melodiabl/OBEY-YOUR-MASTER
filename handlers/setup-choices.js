const { setupFailureNotice } = require('./setup-errors')
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { attachSetupSession } = require('./setup-session')
const { requireSetupAccess } = require('./setup-access')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { setupOrigin } = require('./setup-flow')
const text = (value, locale) => typeof value === 'object' && value !== null ? value[locale] || value.en : value
async function openSetupChoices(client, origin, title, choices, options = {}) {
  const { authorize, authorizeActor, actorPermission } = options
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id, authorizeActor, actorPermission }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const copy = key => t(locale, `setup.form.${key}`)
  let message, page = 0
  const render = () => ({ embeds: [new EmbedBuilder().setColor(0xFFD36F).setTitle(text(title, locale)).setDescription(text(options.description, locale) || copy('chooseSection'))
    .addFields({ name: copy('availableSections'), value: choices.slice(page * 25, page * 25 + 25).map(choice => `**${escapeMarkdown(text(choice.title, locale))}**${choice.description ? ' — ' + text(choice.description, locale) : ''}`).join('\n').slice(0, 1024) })],
    components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('choices_select').setPlaceholder(copy('chooseSection')).addOptions(choices.slice(page * 25, page * 25 + 25).map(choice => ({ label: text(choice.title, locale).slice(0, 100), value: choice.id, ...(choice.description ? { description: text(choice.description, locale).slice(0, 100) } : {}) })))),
      new ActionRowBuilder().addComponents(...(choices.length > 25 ? [new ButtonBuilder().setCustomId('choices_previous').setLabel(copy('previous')).setStyle(ButtonStyle.Secondary).setDisabled(page === 0), new ButtonBuilder().setCustomId('choices_next').setLabel(copy('next')).setStyle(ButtonStyle.Secondary).setDisabled(page >= Math.ceil(choices.length / 25) - 1)] : []), new ButtonBuilder().setCustomId('choices_close').setLabel(copy('close')).setStyle(ButtonStyle.Secondary))], allowedMentions: { parse: [] } })
  try {
    const access = await requireSetupAccess(client, context)
    await authorize?.(access, context)
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, authorize, controls: {
      choices_previous: { async run(i) { page = Math.max(0, page - 1); await i.editReply(render()) } },
      choices_next: { async run(i) { page = Math.min(Math.ceil(choices.length / 25) - 1, page + 1); await i.editReply(render()) } },
      choices_select: { accept: i => i.isStringSelectMenu(), async run(i, session) {
        const choice = choices.slice(page * 25, page * 25 + 25).find(choice => choice.id === i.values?.[0])
        if (i.values.length !== 1 || !choice) throw new Error('invalid_setup_definition')
        await i.editReply({ content: '', embeds: [], components: [] }); session.close('selected')
        const back = () => options.reload ? options.reload(setupOrigin(origin, message, undefined, locale)) : openSetupChoices(client, setupOrigin(origin, message, undefined, locale), title, choices, options)
        await choice.open(client, setupOrigin(origin, message, back, locale))
      } },
      choices_close: { async run(i, session) { await i.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch (error) { const failure = setupFailureNotice(locale, error, notice('unavailable'), 'setup-choices/open'); if (message) await message.edit(failure).catch(() => {}); else await origin.reply(failure) }
}
module.exports = { openSetupChoices }
