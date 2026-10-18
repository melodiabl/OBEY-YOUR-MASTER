const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits: F, escapeMarkdown } = require('discord.js')
const { availableCommands } = require('./help')
const { t, localeFor, normalizeLocale } = require('./i18n')

const PAGE_SIZE = 25
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
class SetupError extends Error { constructor(code) { super(code); this.code = code } }

async function readSetupView(client, context) {
  if (client._shuttingDown || client._dbReady === false) throw new SetupError('unavailable')
  const guild = client.guilds?.cache?.get(context.guildId)
  if (!guild || guild.available === false) throw new SetupError('denied')
  const [member, bot, channel] = await Promise.all([
    guild.members.fetch({ user: context.actorId, force: true }), guild.members.fetchMe({ force: true }),
    guild.channels.fetch(context.channelId),
  ])
  if (member?.id !== context.actorId || member.guild?.id !== guild.id || !member.permissions.has(F.Administrator) ||
    channel?.id !== context.channelId || channel.guildId !== guild.id || !channel.permissionsFor(member)?.has(F.ViewChannel) ||
    !channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) throw new SetupError('denied')
  if (client._shuttingDown || client._dbReady === false) throw new SetupError('unavailable')
  const settings = client.settings.get(guild.id) || {}
  const commands = availableCommands(client, { guild, member, bot, channel, settings, musicState: client.music?.getState(guild.id) })
    .filter(entry => entry.transport === 'prefix' && entry.name !== 'setup' && /^setup(?:-|music$)/.test(entry.name))
    .map(entry => ({ name: entry.name, group: groupFor(entry.name) }))
  return { commands, member, prefix: String(settings.prefix || client.config?.prefix || '!').slice(0, 32),
    locale: normalizeLocale(localeFor(client, guild.id)) === 'en' ? 'en' : 'es' }
}

function buildSetupMessage(view, state = {}) {
  const locale = view.locale, categoryIds = [...new Set(view.commands.map(entry => entry.group))].sort()
  const group = categoryIds.includes(state.group) ? state.group : null
  const commands = group ? view.commands.filter(entry => entry.group === group) : []
  const pages = Math.max(1, Math.ceil(commands.length / PAGE_SIZE))
  const page = Math.max(0, Math.min(pages - 1, Number.isInteger(state.page) ? state.page : 0))
  const shown = commands.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(copy(locale, 'title'))
    .setDescription(group ? copy(locale, 'categoryDescription', { category: copy(locale, `groups.${group}`) }) : copy(locale, 'description'))
    .setFooter({ text: copy(locale, 'footer', { count: view.commands.length, page: page + 1, pages }) })
  if (group) embed.addFields({ name: copy(locale, `groups.${group}`), value: copy(locale, 'categoryCount', { count: commands.length }) })
  else if (categoryIds.length) embed.addFields({ name: copy(locale, 'categories'),
    value: categoryIds.map(id => `${copy(locale, `groups.${id}`)} · ${view.commands.filter(entry => entry.group === id).length}`).join('\n') })
  else embed.addFields({ name: copy(locale, 'categories'), value: copy(locale, 'empty') })
  const components = []
  if (categoryIds.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_group').setPlaceholder(copy(locale, 'chooseCategory')).addOptions(categoryIds.map(id => ({
      label: copy(locale, `groups.${id}`), value: id, default: group === id,
    })))))
  if (shown.length) components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
    .setCustomId('setup_command').setPlaceholder(copy(locale, 'chooseCommand')).addOptions(shown.map(entry => ({
      label: (view.prefix + entry.name).slice(0, 100), value: entry.name, description: copy(locale, 'openDescription'),
    })))))
  const button = (id, label, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(copy(locale, label))
    .setStyle(id === 'setup_close' ? ButtonStyle.Danger : ButtonStyle.Secondary).setDisabled(disabled)
  components.push(new ActionRowBuilder().addComponents(button('setup_prev', 'previous', !group || page === 0),
    button('setup_home', 'home', !group), button('setup_next', 'next', !group || page === pages - 1), button('setup_close', 'close')))
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}

async function openSetup(client, origin) {
  const context = { guildId: origin.guild?.id, actorId: origin.author.id, channelId: origin.channelId || origin.channel?.id }
  let locale = normalizeLocale(localeFor(client, context.guildId)) === 'en' ? 'en' : 'es'
  const notice = key => ({ content: copy(locale, key), embeds: [], components: [], allowedMentions: { parse: [] } })
  let message
  try {
    let view = await readSetupView(client, context)
    locale = view.locale
    const state = { group: null, page: 0 }
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
          const offered = view.commands.filter(entry => entry.group === state.group).slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE)
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
          await interaction.editReply({ content: copy(locale, 'openingCommand', { command: safe(fresh.prefix + selected, 140) }), embeds: [], components: [], allowedMentions: { parse: [] } })
          if (closed || client._shuttingDown) return
          const launch = await readSetupView(client, context)
          if (closed) return
          if (!launch.commands.some(entry => entry.name === selected) || client.commands.get(selected) !== command) throw new SetupError('denied')
          collector.stop('selected')
          await command.run(client, origin, [], launch.member, '', launch.prefix)
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
      queue = queue.then(() => message.edit(['time', 'idle'].includes(reason) ? notice('expired') : { components: [] })).catch(() => {})
    })
    return collector
  } catch {
    if (message) await message.edit(notice('unavailable')).catch(() => {})
    else await origin.reply(notice('unavailable'))
  }
}

module.exports = { readSetupView, buildSetupMessage, openSetup }
