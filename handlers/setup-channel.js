const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, PermissionFlagsBits: F } = require('discord.js')
const { t, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { attachSetupSession } = require('./setup-session')
const { createSetupSettings } = require('./setup-settings')
const { CHANNEL_SETUPS } = require('./setup-definitions')

const copy = (locale, key, variables) => t(locale, `setup.channels.${key}`, variables)
const isEnabled = id => typeof id === 'string' && !['', 'no', 'nochannel'].includes(id)
function buildChannelSetup(id, value, selected, locale, status = '') {
  const display = channel => isEnabled(channel) && /^\d{17,20}$/.test(channel) ? `<#${channel}>` : copy(locale, isEnabled(channel) ? 'unavailableChannel' : 'disabled')
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, `names.${id}`)).setDescription(copy(locale, 'description'))
    .addFields({ name: copy(locale, 'current'), value: display(value.values.channel), inline: true },
      { name: copy(locale, 'pending'), value: selected === undefined ? copy(locale, 'unchanged') : display(selected), inline: true })
    .setFooter({ text: copy(locale, status || (selected === undefined ? 'currentStatus' : 'unsaved')) })
  const button = (key, text, style = ButtonStyle.Secondary, disabled = false) => new ButtonBuilder().setCustomId(key).setLabel(copy(locale, text)).setStyle(style).setDisabled(disabled)
  return { embeds: [embed], components: [new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('channel_select')
    .setPlaceholder(copy(locale, 'choose')).setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setMinValues(0).setMaxValues(1)),
  new ActionRowBuilder().addComponents(button('channel_disable', 'disable'), button('channel_save', 'save', ButtonStyle.Primary, selected === undefined),
    button('channel_discard', 'discard', ButtonStyle.Secondary, selected === undefined), button('channel_close', 'close'))], allowedMentions: { parse: [], repliedUser: false } }
}
async function openChannelSetup(client, origin, id) {
  if (!Object.hasOwn(CHANNEL_SETUPS, id)) throw new Error('invalid_setup_definition')
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: t(locale, `setup.editor.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })
  const service = createSetupSettings(client.settings, CHANNEL_SETUPS[id], () => Boolean(client._shuttingDown))
  let message
  try {
    await requireSetupAccess(client, context)
    let value = await service.read(context.guildId), selected
    const render = status => buildChannelSetup(id, value, selected, locale, status)
    message = await origin.reply(render())
    return attachSetupSession(client, message, context, { notice, controls: {
      channel_select: { accept: interaction => interaction.isChannelSelectMenu(), async run(interaction) {
        if (!Array.isArray(interaction.values) || interaction.values.length > 1) throw new Error('invalid_channel')
        selected = interaction.values[0] || 'no'
        if (selected === value.values.channel) selected = undefined
        await interaction.editReply(render())
      } },
      channel_disable: { async run(interaction) { selected = value.values.channel === 'no' ? undefined : 'no'; await interaction.editReply(render()) } },
      channel_discard: { async run(interaction) { selected = undefined; await interaction.editReply(render()) } },
      channel_save: { async run(interaction, session) {
        if (selected === undefined) return
        if (isEnabled(selected)) {
          const { guild, member, bot } = await requireSetupAccess(client, context), target = await guild.channels.fetch(selected)
          if (!session.active()) return
          if (!target || target.guildId !== guild.id || ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(target.type) ||
            !target.permissionsFor(member)?.has(F.ViewChannel) || !target.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) {
            await interaction.followUp({ content: copy(locale, 'permissions'), ephemeral: true, allowedMentions: { parse: [] } })
            return
          }
        }
        if (!session.active()) return
        let status = 'saved'
        try { value = await service.save(context.guildId, { channel: selected }, value.revision); selected = undefined }
        catch (error) {
          if (error.code !== 'setup_conflict') throw error
          await requireSetupAccess(client, context)
          value = await service.read(context.guildId); status = 'conflict'
        }
        await interaction.editReply(render(status))
      } },
      channel_close: { async run(interaction, session) { await interaction.editReply(notice('closed')); session.close('closed') } },
    } })
  } catch { if (message) await message.edit(notice('unavailable')).catch(() => {}); else await origin.reply(notice('unavailable')) }
}

module.exports = { buildChannelSetup, openChannelSetup }
