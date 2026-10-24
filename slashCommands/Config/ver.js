const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder, PermissionFlagsBits: F } = require('discord.js')
const { createConfigurationSummary } = require('../../handlers/configuration-summary')
const { requireSetupAccess } = require('../../handlers/setup-access')
const { setupFailureNotice } = require('../../handlers/setup-errors')
const { CATEGORIES } = require('../../handlers/logs/policy')
const { t, localeFor, normalizeLocale } = require('../../handlers/i18n')

module.exports = {
  name: 'ver',
  description: 'Ver la configuración actual del servidor',
  memberpermissions: ['ManageGuild'],
  options: [],

  run: async (client, interaction) => {
    const gid = interaction.guild.id
    const g = interaction.guild
    const fallbackLocale = localeFor(client, gid)
    const context = {
      guildId: gid, actorId: interaction.user.id, channelId: interaction.channelId,
      actorPermission: F.ManageGuild,
    }
    const notice = key => ({ content: t(fallbackLocale, `setup.summary.${key}`), embeds: [], components: [], allowedMentions: { parse: [] } })

    await interaction.deferReply({ ephemeral: true })
    try {
      await requireSetupAccess(client, context)
      const summary = await createConfigurationSummary(client).read(gid)
      await requireSetupAccess(client, context)
      const locale = normalizeLocale(summary.language)
      const copy = (key, variables) => t(locale, `setup.summary.${key}`, variables)
      const roleValue = roles => roles.length ? roles.slice(0, 5).map(id => `<@&${id}>`).join(', ') : copy('none')
      const channelValue = channelId => channelId ? `<#${channelId}>` : copy('notConfigured')
      const musicValue = summary.music.enabled
        ? (summary.music.configured ? copy('musicEnabled') : copy('musicDefault'))
        : copy('musicDisabled')
      const logRouting = CATEGORIES.map(category => {
        const route = summary.logs.routing[category]
        const value = route.state === 'disabled' ? copy('logsDisabled') : route.channelId ? `<#${route.channelId}>` : copy('logsNotConfigured')
        const inherited = route.state === 'inherited' ? ` (${copy('logsGeneral')})` : ''
        return `${copy(`log_${category}`)}: ${value}${inherited}`
      }).join('\n')

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(obeyUi.limit(`${obeyUi.markup("icon.settings")} ${copy('title', { guild: g.name })}`, 256))
        .setThumbnail(g.iconURL())
        .addFields(
          { name: obeyUi.owned(copy('prefix')),    value: `\`${summary.prefix.replace(/`/g, '\\`')}\``, inline: true },
          { name: obeyUi.owned(copy('language')),  value: summary.languageLabel,                        inline: true },
          { name: obeyUi.owned(copy('music')),     value: musicValue,                                  inline: true },
          { name: obeyUi.owned(copy('logs')),      value: channelValue(summary.logs.defaultChannel),    inline: true },
          { name: obeyUi.owned(copy('logsRouting')), value: logRouting,                                inline: false },
          { name: obeyUi.owned(copy('welcome')),   value: channelValue(summary.welcome.channelId),      inline: true },
          { name: obeyUi.owned(copy('autoroles')), value: roleValue(summary.autoroles),                 inline: true },
          { name: obeyUi.owned(copy('adminRoles')), value: roleValue(summary.adminRoles),               inline: false },
        )
        .setFooter(obeyMeta.asFooter({ text: copy('footer') }))
        .setTimestamp()

      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      return interaction.editReply(setupFailureNotice(fallbackLocale, error, notice('unavailable'), 'config/ver'))
    }
  },
}
