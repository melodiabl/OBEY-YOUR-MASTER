const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

const LANGUAGES = {
  es: obeyUi.owned('🇪🇸 Español'),
  en: obeyUi.owned('🇬🇧 English'),
  de: obeyUi.owned('🇩🇪 Deutsch'),
  fr: obeyUi.owned('🇫🇷 Français'),
  it: obeyUi.owned('🇮🇹 Italiano'),
  nl: obeyUi.owned('🇳🇱 Dutch'),
  tr: obeyUi.owned('🇹🇷 Türkçe'),
}

module.exports = {
  name: 'idioma',
  description: 'Cambiar el idioma del bot en este servidor',
  memberpermissions: ['Administrator'],
  options: [
    {
      StringChoices: {
        name: 'idioma',
        description: 'Idioma del bot',
        required: true,
        choices: Object.entries(LANGUAGES).map(([k, v]) => [v, k]),
      },
    },
  ],

  run: async (client, interaction) => {
    const lang = interaction.options.getString('idioma')

    client.settings.set(interaction.guild.id, lang, 'language')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle(obeyUi.limit(obeyUi.owned('✅ Idioma actualizado'), 256))
        .setDescription(obeyUi.limit(`Idioma establecido: **${LANGUAGES[lang] || lang}**`, 4096))
        .setFooter(obeyMeta.asFooter({ text: `Cambiado por ${interaction.user.tag}` }))],
    })
  },
}
