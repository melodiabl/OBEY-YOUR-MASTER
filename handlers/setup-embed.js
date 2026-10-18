const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { asFooter } = require('./presentation/metadata')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')
const { EMBED_FIELDS, parseColor } = require('./setup-definitions')

const copy = (locale, key, values) => t(locale, `setup.embed.${key}`, values)
function buildEmbedSetup(client, value, draft, locale, status = '') {
  const current = { ...value.values, ...draft }, dirty = Object.keys(draft).length > 0
  const color = parseColor(current.color) ?? 0xFFD36F
  const preview = new EmbedBuilder().setColor(color).setTitle(copy(locale, 'previewTitle')).setDescription(copy(locale, 'previewDescription'))
  const footer = client.getFooter ? client.getFooter(current) : { text: current.footertext || client.user.username, iconURL: current.footericon || client.user.displayAvatarURL() }
  preview.setFooter(asFooter(footer))
  if (current.thumb) preview.setThumbnail(asFooter({ text: 'icon', iconURL: current.footericon })?.iconURL || client.user.displayAvatarURL())
  const info = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, 'title')).setDescription(copy(locale, 'description'))
    .addFields({ name: copy(locale, 'color'), value: '#' + color.toString(16).padStart(6, '0'), inline: true },
      { name: copy(locale, 'thumbnail'), value: copy(locale, current.thumb ? 'enabled' : 'disabled'), inline: true })
    .setFooter({ text: copy(locale, status || (dirty ? 'unsaved' : 'current')) })
  const button = (id, label, style = ButtonStyle.Secondary, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, label)).setStyle(style).setDisabled(disabled)
  return { embeds: [info, preview], components: [new ActionRowBuilder().addComponents(button('embed_edit', 'edit'), button('embed_thumb', 'toggleThumbnail'),
    button('embed_save', 'save', ButtonStyle.Primary, !dirty), button('embed_discard', 'discard', ButtonStyle.Secondary, !dirty), button('embed_close', 'close'))], allowedMentions: { parse: [], repliedUser: false } }
}
async function openEmbedSetup(client, origin) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const service = createSetupSettings(client.settings, EMBED_FIELDS, () => Boolean(client._shuttingDown))
  let message
  try {
    await requireSetupAccess(client, context)
    let value = await service.read(context.guildId), draft = {}
    const render = status => buildEmbedSetup(client, value, draft, locale, status)
    const change = patch => { draft = { ...draft, ...patch }; for (const key of Object.keys(draft)) if (draft[key] === value.values[key]) delete draft[key] }
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, hasUnsavedChanges: () => Object.keys(draft).length > 0, controls: {
      embed_edit: {
        modal() {
          const current = { ...value.values, ...draft }, modal = new ModalBuilder().setTitle(copy(locale, 'edit'))
          for (const id of ['color', 'footertext', 'footericon']) modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id)
            .setLabel(copy(locale, id)).setStyle(TextInputStyle.Short).setRequired(id === 'color').setMaxLength(id === 'color' ? 80 : 2048)
            .setValue(String(id === 'color' ? '#' + (parseColor(current.color) ?? 0xFFD36F).toString(16).padStart(6, '0') : current[id] || '').slice(0, id === 'color' ? 80 : 2048))))
          return modal
        },
        async run(interaction) {
          const patch = {}
          for (const id of ['color', 'footertext', 'footericon']) {
            const result = EMBED_FIELDS[id].schema.safeParse(interaction.fields.getTextInputValue(id))
            if (!result.success) { await interaction.followUp({ content: copy(locale, 'invalid', { field: copy(locale, id) }), ephemeral: true, allowedMentions: { parse: [] } }); return }
            patch[id] = result.data
          }
          change(patch)
          await interaction.editReply(render())
        },
      },
      embed_thumb: { async run(interaction) { change({ thumb: !Boolean({ ...value.values, ...draft }.thumb) }); await interaction.editReply(render()) } },
      embed_discard: { async run(interaction) { draft = {}; await interaction.editReply(render()) } },
      embed_save: { async run(interaction) {
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
      embed_close: { async run(interaction, session) { await interaction.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}

module.exports = { buildEmbedSetup, openEmbedSetup }
