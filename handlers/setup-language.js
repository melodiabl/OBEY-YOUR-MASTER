const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { requireSetupAccess } = require('./setup-access')
const { LANGUAGES, createLanguageSettings } = require('./language-settings')
const { t, localeFor, normalizeLocale } = require('./i18n')

const copy = (locale, key, variables) => t(locale, `setup.language.${key}`, variables)
const languageName = code => LANGUAGES.find(language => language.code === (code === 'sp' ? 'es' : code))?.name
function availableLanguages(client) { return LANGUAGES.filter(language => Object.hasOwn(client.la || {}, language.code) && client.la[language.code] && typeof client.la[language.code] === 'object') }

function buildLanguageMessage(value, selected, languages, locale, status = '') {
  const pending = languages.find(language => language.code === selected)
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, 'title')).setDescription(copy(locale, 'description'))
    .addFields({ name: copy(locale, 'current'), value: languageName(value.language) || copy(locale, 'unavailableLanguage'), inline: true },
      { name: copy(locale, 'pending'), value: pending?.name || copy(locale, 'unchanged'), inline: true })
  if (status) embed.setFooter({ text: copy(locale, status) })
  const components = []
  if (languages.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('language_select')
    .setPlaceholder(copy(locale, 'choose')).addOptions(languages.map(language => ({ label: language.name, value: language.code, default: selected === language.code })))))
  components.push(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('language_save').setLabel(copy(locale, 'save')).setStyle(ButtonStyle.Primary).setDisabled(!pending || selected === value.language),
    new ButtonBuilder().setCustomId('language_reset').setLabel(copy(locale, 'reset')).setStyle(ButtonStyle.Secondary).setDisabled(!languages.some(language => language.code === 'en')),
    new ButtonBuilder().setCustomId('language_close').setLabel(copy(locale, 'close')).setStyle(ButtonStyle.Secondary)))
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}

async function openLanguageSetup(client, origin) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  const service = createLanguageSettings(client.settings, () => Boolean(client._shuttingDown))
  let locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es', message
  const notice = key => ({ content: copy(locale, key), embeds: [], components: [], allowedMentions: { parse: [] } })
  try {
    await requireSetupAccess(client, context)
    let value = await service.read(context.guildId), selected = null
    locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
    message = await origin.reply(buildLanguageMessage(value, selected, availableLanguages(client), locale))
    const collector = message.createMessageComponentCollector({ time: 180000, idle: 90000 })
    let closed = false, queue = Promise.resolve()
    collector.on('collect', interaction => {
      const allowed = interaction.customId === 'language_select' ? interaction.isStringSelectMenu() : ['language_save', 'language_reset', 'language_close'].includes(interaction.customId) && interaction.isButton()
      if (closed || !allowed || interaction.user.id !== context.actorId || interaction.guildId !== context.guildId || interaction.message?.id !== message.id) {
        void interaction.reply({ content: copy(locale, 'notYours'), ephemeral: true, allowedMentions: { parse: [] } }).catch(() => {})
        return
      }
      let acknowledgement
      try { acknowledgement = Promise.resolve(interaction.deferUpdate()).then(() => true, () => false) } catch { return }
      queue = queue.then(async () => {
        if (!await acknowledgement || closed) return
        if (interaction.customId === 'language_close') {
          await interaction.editReply(notice('closed'))
          collector.stop('closed')
          return
        }
        await requireSetupAccess(client, context)
        if (closed) return
        const languages = availableLanguages(client)
        let status = 'unsaved'
        if (interaction.customId === 'language_select' || interaction.customId === 'language_reset') {
          const wanted = interaction.customId === 'language_reset' ? 'en' : interaction.values?.[0]
          if (!languages.some(language => language.code === wanted)) throw new Error('invalid_language')
          selected = wanted
        } else {
          if (selected === null) return
          if (!languages.some(language => language.code === selected)) throw new Error('invalid_language')
          try { value = await service.save(context.guildId, selected, value.revision); selected = null; status = 'saved' }
          catch (error) {
            if (error.code !== 'language_conflict') throw error
            await requireSetupAccess(client, context)
            if (closed) return
            value = await service.read(context.guildId); status = 'conflict'
          }
          locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
        }
        if (!closed) await interaction.editReply(buildLanguageMessage(value, selected, languages, locale, status))
      }).catch(async () => {
        collector.stop('unavailable')
        await message.edit(notice('unavailable')).catch(() => {})
      })
    })
    collector.on('end', (_, reason) => {
      closed = true
      queue = queue.then(() => message.edit(['time', 'idle'].includes(reason) ? notice('expired') : { components: [] })).catch(() => {})
    })
    return collector
  } catch {
    if (message) await message.edit(notice('unavailable')).catch(() => {})
    else await origin.reply(notice('unavailable'))
  }
}

module.exports = { availableLanguages, buildLanguageMessage, openLanguageSetup }
