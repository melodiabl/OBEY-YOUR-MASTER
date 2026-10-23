const { EmbedBuilder } = require('discord.js')
const { LANGUAGES, createLanguageSettings } = require('../../handlers/language-settings')
const { availableLanguages } = require('../../handlers/setup-language')
const { requireSetupAccess } = require('../../handlers/setup-access')
const { setupFailureNotice } = require('../../handlers/setup-errors')
const { t, localeFor } = require('../../handlers/i18n')

module.exports = {
  name: 'idioma',
  description: 'Cambiar el idioma del bot en este servidor',
  memberpermissions: ['Administrator'],
  options: [{ StringChoices: {
    name: 'idioma', description: 'Idioma del bot', required: true,
    choices: LANGUAGES.map(({ code, name }) => [name, code]),
  } }],
  run: async (client, interaction) => {
    const locale = localeFor(client, interaction.guild.id)
    const context = { guildId: interaction.guild.id, actorId: interaction.user.id, channelId: interaction.channelId }
    await interaction.deferReply({ ephemeral: true })
    try {
      await requireSetupAccess(client, context)
      const language = interaction.options.getString('idioma')
      const selected = availableLanguages(client).find(item => item.code === language)
      if (!selected) throw Object.assign(new Error('language_invalid'), { code: 'language_invalid' })
      const service = createLanguageSettings(client.settings, () => Boolean(client._shuttingDown))
      const before = await service.read(context.guildId)
      await requireSetupAccess(client, context)
      await service.save(context.guildId, language, before.revision)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle(t(language, 'setup.language.saved')).setDescription(selected.name)], allowedMentions: { parse: [] } })
    } catch (error) {
      const key = error.code === 'language_conflict' ? 'conflict' : 'unavailable'
      return interaction.editReply(setupFailureNotice(locale, error, {
        content: t(locale, `setup.language.${key}`), embeds: [], components: [], allowedMentions: { parse: [] },
      }, 'language/slash'))
    }
  },
}
