const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { availableCommands } = require('./help')
const { t, catalogs, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { setupOrigin } = require('./setup-flow')

const PAGE_SIZE = 25
const QUICK_COMMANDS = ['setup-welcome', 'setup-ticket', 'setupmusic', 'setup-language', 'setup-logger']
const GROUP_ORDER = ['general', 'welcome', 'music', 'support', 'roles', 'security', 'logs', 'feeds', 'community']
const groups = [
  ['welcome', /^setup-(welcome|leave|boost$|joinlist)/],
  ['logs', /^setup-.*(log|serverstats)/],
  ['security', /^setup-(admin$|anti|blacklist|ghost|warn$|mute$|validcode$|epicgamesverify$|autowarn$)/],
  ['music', /^(setupmusic|setup-(music|radio|jtc|joinvc))$/],
  ['support', /^setup-(apply|menuapply|ticket|menuticket|autosupport)$/],
  ['roles', /^setup-(rank|reactionrole|roster|membercount)$/],
  ['feeds', /^setup-(tiktok|twitch|twitter|youtube)$/],
  ['general', /^setup-(language|embed|commands)$/],
]
const groupFor = name => groups.find(([, pattern]) => pattern.test(name))?.[0] || 'community'
const copy = (locale, key, variables) => t(locale, `setup.navigation.${key}`, variables)
const safe = (value, limit) => escapeMarkdown(String(value)).slice(0, limit)
function commandPresentation(name, locale) {
  return catalogs[locale]?.setup.navigation.commands[name] || { title: name.replace(/^setup-?/, '').replaceAll('-', ' '), description: copy(locale, 'openDescription') }
}
function shownCommands(view, state) {
  return state.group ? view.commands.filter(entry => entry.group === state.group).slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)
    : QUICK_COMMANDS.flatMap(name => view.commands.filter(entry => entry.name === name))
}
class SetupError extends Error { constructor(code) { super(code); this.code = code } }

async function readSetupView(client, context) {
  const { guild, member, bot, channel } = await requireSetupAccess(client, context)
  const settings = client.settings.get(guild.id) || {}
  const commands = availableCommands(client, { guild, member, bot, channel, settings, musicState: client.music?.getState(guild.id) })
    .filter(entry => entry.transport === 'prefix' && entry.name !== 'setup' && /^setup(?:-|music$)/.test(entry.name))
    .map(entry => ({ name: entry.name, group: groupFor(entry.name) }))
  return { commands, member, prefix: String(settings.prefix || client.config?.prefix || '!').slice(0, 32),
    locale: normalizeLocale(localeFor(client, guild.id)) === 'en' ? 'en' : 'es' }
}

function buildSetupMessage(view, state = {}) {
  const locale = view.locale, categoryIds = GROUP_ORDER.filter(id => view.commands.some(entry => entry.group === id))
  const group = categoryIds.includes(state.group) ? state.group : null
  const commands = group ? view.commands.filter(entry => entry.group === group) : []
  const pages = Math.max(1, Math.ceil(commands.length / PAGE_SIZE))
  const page = Math.max(0, Math.min(pages - 1, Number.isInteger(state.page) ? state.page : 0))
  const shown = shownCommands(view, { group, page })
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, 'title'))
    .setDescription(group ? copy(locale, 'categoryDescription', { category: copy(locale, `groups.${group}`) }) : copy(locale, 'description'))
    .setFooter({ text: copy(locale, 'footer', { count: view.commands.length, page: page + 1, pages }) })
  if (group) embed.addFields({ name: copy(locale, `groups.${group}`), value: copy(locale, `groupDescriptions.${group}`) })
  else if (categoryIds.length) embed.addFields({ name: copy(locale, 'categories'),
    value: categoryIds.map(id => `**${copy(locale, `groups.${id}`)}** — ${copy(locale, `groupDescriptions.${id}`)}`).join('\n') })
  else embed.addFields({ name: copy(locale, 'categories'), value: copy(locale, 'empty') })
  const components = []
  if (categoryIds.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_group').setPlaceholder(copy(locale, 'chooseCategory')).addOptions(categoryIds.map(id => ({
      label: copy(locale, `groups.${id}`), value: id, description: copy(locale, `groupDescriptions.${id}`), default: group === id,
    })))))
  if (shown.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_command').setPlaceholder(copy(locale, group ? 'chooseCommand' : 'chooseQuick')).addOptions(shown.map(entry => ({
      label: commandPresentation(entry.name, locale).title.slice(0, 100), value: entry.name, description: commandPresentation(entry.name, locale).description.slice(0, 100),
    })))))
  const button = (id, label, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, label))
    .setStyle(id === 'setup_close' ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(disabled)
  components.push(new ActionRowBuilder().addComponents(button('setup_prev', 'previous', !group || page === 0),
    button('setup_home', 'home', !group), button('setup_next', 'next', !group || page === pages - 1), button('setup_close', 'close')))
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}

async function openSetup(client, origin, initialState = {}) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  let locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: copy(locale, key), embeds: [], components: [], allowedMentions: { parse: [] } })
  let message
  try {
    let view = await readSetupView(client, context)
    locale = view.locale
    const state = { group: initialState.group || null, page: initialState.page || 0 }
    message = await origin.reply(buildSetupMessage(view, state))
    const collector = message.createMessageComponentCollector({ time: 180000, idle: 90000 })
    const controls = new Set(['setup_group', 'setup_command', 'setup_prev', 'setup_next', 'setup_home', 'setup_close'])
    let closed = false, queue = Promise.resolve()
    collector.on('collect', interaction => {
      if (closed || interaction.user.id !== context.actorId || interaction.guildId !== context.guildId || interaction.message?.id !== message.id ||
        !controls.has(interaction.customId) || !interaction.isButton() && !interaction.isStringSelectMenu()) {
        void interaction.reply({ content: copy(locale, 'notYours'), ephemeral: true, allowedMentions: { parse: [] } }).catch(() => {})
        return
      }
      // ACK immediately; providers and previous controls may take longer than Discord's deadline.
      let acknowledged
      try { acknowledged = Promise.resolve(interaction.deferUpdate()).then(() => true, () => false) } catch { return }
      queue = queue.then(async () => {
        if (!await acknowledged || closed) return
        if (interaction.customId === 'setup_close') {
          await interaction.editReply(notice('closed'))
          collector.stop('closed')
          return
        }
        const fresh = await readSetupView(client, context)
        locale = fresh.locale
        if (closed) return
        if (interaction.customId === 'setup_command') {
          const selected = interaction.values?.[0]
          const offered = shownCommands(view, state)
          const command = client.commands.get(selected)
          if (!offered.some(entry => entry.name === selected) || !fresh.commands.some(entry => entry.name === selected) || typeof command?.run !== 'function') throw new SetupError('denied')
          // Claim the existing per-command cooldown before yielding to another session.
          client.cooldowns ||= new Map()
          if (!client.cooldowns.has(selected)) client.cooldowns.set(selected, new Map())
          const timestamps = client.cooldowns.get(selected), now = Date.now()
          const duration = (Number(command.cooldown) > 0 ? Number(command.cooldown) : 1) * 1000
          if (now < (timestamps.get(context.actorId) || 0) + duration) {
            await interaction.followUp({ content: copy(locale, 'cooldown'), ephemeral: true, allowedMentions: { parse: [] } })
            return
          }
          timestamps.set(context.actorId, now)
          setTimeout(() => { if (timestamps.get(context.actorId) === now) timestamps.delete(context.actorId) }, duration).unref()
          await interaction.editReply({ content: copy(locale, 'openingCommand', { command: safe(commandPresentation(selected, locale).title, 140) }), embeds: [], components: [], allowedMentions: { parse: [] } })
          if (closed || client._shuttingDown) return
          const launch = await readSetupView(client, context)
          if (closed) return
          if (!launch.commands.some(entry => entry.name === selected) || client.commands.get(selected) !== command) throw new SetupError('denied')
          collector.stop('selected')
          const parentState = { ...state }
          const back = () => openSetup(client, setupOrigin(origin, message, undefined, locale), parentState)
          await command.run(client, setupOrigin(origin, message, back, locale), [], launch.member, '', launch.prefix)
          return
        }
        view = fresh
        if (interaction.customId === 'setup_group') {
          const group = interaction.values?.[0]
          if (!view.commands.some(entry => entry.group === group)) throw new SetupError('denied')
          state.group = group; state.page = 0
        } else if (interaction.customId === 'setup_home') { state.group = null; state.page = 0 }
        else state.page += interaction.customId === 'setup_next' ? 1 : -1
        const pages = Math.max(1, Math.ceil(view.commands.filter(entry => entry.group === state.group).length / PAGE_SIZE))
        state.page = Math.max(0, Math.min(pages - 1, state.page))
        if (!view.commands.some(entry => entry.group === state.group)) state.group = null
        if (!closed) await interaction.editReply(buildSetupMessage(view, state))
      }).catch(async () => {
        collector.stop('unavailable')
        await message.edit(notice('unavailable')).catch(() => {})
      })
    })
    collector.on('end', (_, reason) => {
      closed = true
      // Cleanup follows any edit already in flight so it cannot revive old controls.
      if (reason !== 'selected') queue = queue.then(() => message.edit(['time', 'idle'].includes(reason) ? notice('expired') : { components: [] })).catch(() => {})
    })
    return collector
  } catch {
    if (message) await message.edit(notice('unavailable')).catch(() => {})
    else await origin.reply(notice('unavailable'))
  }
}

module.exports = { readSetupView, buildSetupMessage, openSetup }
