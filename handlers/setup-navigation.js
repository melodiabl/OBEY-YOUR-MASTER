const { setupFailureNotice } = require('./setup-errors')
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, escapeMarkdown } = require('discord.js')
const { availableCommands } = require('./help')
const { t, catalogs, localeFor, normalizeLocale } = require('./i18n')
const { requireSetupAccess } = require('./setup-access')
const { setupOrigin } = require('./setup-flow')

const PAGE_SIZE = 25
const QUICK_COMMANDS = ['setup-welcome', 'setup-ticket', 'setupmusic', 'setup-language', 'setup-logger']
const GROUP_ORDER = ['general', 'welcome', 'music', 'support', 'roles', 'security', 'logs', 'feeds', 'community']
// These adapters share the same operation. Keep their commands, offer one entry.
const EQUIVALENT_SETUPS = [
  ['setup-antimention', 'setup-antimassmention', 'setup-antimasspings', 'setup-antipings'],
  ['setup-logger', 'setup-auditlog'], ['setup-membercount', 'setup-serverstats'], ['setupmusic', 'setup-music'],
]
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
function setupState(view, state = {}) {
  const group = view.commands.some(entry => entry.group === state.group) ? state.group : null
  const pages = Math.max(1, Math.ceil(view.commands.filter(entry => entry.group === group).length / PAGE_SIZE))
  return { group, page: Math.max(0, Math.min(pages - 1, Number.isInteger(state.page) ? state.page : 0)), browse: Boolean(state.browse || group) }
}
function shownCommands(view, state) {
  state = setupState(view, state)
  return state.group ? view.commands.filter(entry => entry.group === state.group).slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)
    : state.browse ? [] : QUICK_COMMANDS.flatMap(name => view.commands.filter(entry => entry.name === name))
}
class SetupError extends Error { constructor(code) { super(code); this.code = code } }

async function readSetupView(client, context) {
  const { guild, member, bot, channel } = await requireSetupAccess(client, context)
  const settings = client.settings.get(guild.id) || {}
  const available = availableCommands(client, { guild, member, bot, channel, settings, musicState: client.music?.getState(guild.id) })
    .filter(entry => entry.transport === 'prefix' && entry.name !== 'setup' && /^setup(?:-|music$)/.test(entry.name))
  const preferred = new Set(EQUIVALENT_SETUPS.map(names => names.find(name => available.some(entry => entry.name === name))))
  const commands = available.filter(entry => !EQUIVALENT_SETUPS.some(names => names.includes(entry.name)) || preferred.has(entry.name))
    .map(entry => ({ name: entry.name, group: groupFor(entry.name) }))
  return { commands, member, prefix: String(settings.prefix || client.config?.prefix || '!').slice(0, 32),
    locale: normalizeLocale(localeFor(client, guild.id)) === 'en' ? 'en' : 'es' }
}

function buildSetupMessage(view, state = {}) {
  const locale = view.locale, categoryIds = GROUP_ORDER.filter(id => view.commands.some(entry => entry.group === id))
  const { group, page, browse } = setupState(view, state)
  const commands = group ? view.commands.filter(entry => entry.group === group) : []
  const pages = Math.max(1, Math.ceil(commands.length / PAGE_SIZE))
  const shown = shownCommands(view, { group, page, browse })
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(group ? copy(locale, `groups.${group}`) : copy(locale, 'title'))
    .setDescription(!categoryIds.length ? copy(locale, 'empty') : group ? copy(locale, `groupDescriptions.${group}`) : copy(locale, browse ? 'browseDescription' : 'description'))
  if (group && pages > 1) embed.setFooter({ text: copy(locale, 'footer', { count: view.commands.length, page: page + 1, pages }) })
  const components = []
  if (!group && browse && categoryIds.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_group').setPlaceholder(copy(locale, 'chooseCategory')).addOptions(categoryIds.map(id => ({
      label: copy(locale, `groups.${id}`), value: id, description: copy(locale, `groupDescriptions.${id}`), default: group === id,
    })))))
  if (shown.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_command').setPlaceholder(copy(locale, group ? 'chooseCommand' : 'chooseQuick')).addOptions(shown.map(entry => ({
      label: commandPresentation(entry.name, locale).title.slice(0, 100), value: entry.name, description: commandPresentation(entry.name, locale).description.slice(0, 100),
    })))))
  const button = (id, label, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, label))
    .setStyle(id === 'setup_close' ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(disabled)
  components.push(new ActionRowBuilder().addComponents(...(group && pages > 1 ? [button('setup_prev', 'previous', page === 0), button('setup_next', 'next', page === pages - 1)] : []),
    ...(group ? [button('setup_browse', 'back')] : browse ? [button('setup_home', 'back')] : categoryIds.length ? [button('setup_browse', 'browse')] : []), button('setup_close', 'close')))
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
    let state = setupState(view, initialState)
    message = await origin.reply(buildSetupMessage(view, state))
    const collector = message.createMessageComponentCollector({ time: 180000, idle: 90000 })
    const controls = new Set(['setup_group', 'setup_command', 'setup_prev', 'setup_next', 'setup_home', 'setup_browse', 'setup_close'])
    let closed = false, queue = Promise.resolve()
    collector.on('collect', interaction => {
      const validType = ['setup_group', 'setup_command'].includes(interaction.customId)
        ? interaction.isStringSelectMenu() && interaction.values?.length === 1 : interaction.isButton()
      if (closed || interaction.user.id !== context.actorId || interaction.guildId !== context.guildId || interaction.message?.id !== message.id ||
        !controls.has(interaction.customId) || !validType) {
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
          state.group = group; state.page = 0; state.browse = true
        } else if (interaction.customId === 'setup_home') { state.group = null; state.page = 0; state.browse = false }
        else if (interaction.customId === 'setup_browse') { state.group = null; state.page = 0; state.browse = true }
        else state.page += interaction.customId === 'setup_next' ? 1 : -1
        state = setupState(view, state)
        if (!closed) await interaction.editReply(buildSetupMessage(view, state))
      }).catch(async error => {
        collector.stop('unavailable')
        await message.edit(setupFailureNotice(locale, error, notice('unavailable'), 'setup-navigation/control')).catch(() => {})
      })
    })
    collector.on('end', (_, reason) => {
      closed = true
      // Cleanup follows any edit already in flight so it cannot revive old controls.
      if (reason !== 'selected') queue = queue.then(() => message.edit(['time', 'idle'].includes(reason) ? notice('expired') : { components: [] })).catch(() => {})
    })
    return collector
  } catch (error) {
    const failure = setupFailureNotice(locale, error, notice('unavailable'), 'setup-navigation/open')
    if (message) await message.edit(failure).catch(() => {})
    else await origin.reply(failure)
  }
}

async function openSlashSetup(client, interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const origin = {
    guild: interaction.guild, author: interaction.user, channel: interaction.channel, channelId: interaction.channelId,
    async reply(payload) {
      const message = await interaction.editReply(payload)
      return Object.create(message, { edit: { value: next => interaction.editReply(next) } })
    },
  }
  return openSetup(client, origin)
}

module.exports = { readSetupView, buildSetupMessage, openSetup, openSlashSetup }
