const { EmbedBuilder } = require('discord.js')

const LANGUAGES = {
  es: '🇪🇸 Español',
  en: '🇬🇧 English',
  de: '🇩🇪 Deutsch',
  fr: '🇫🇷 Français',
  it: '🇮🇹 Italiano',
  nl: '🇳🇱 Dutch',
  tr: '🇹🇷 Türkçe',
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
        .setTitle('✅ Idioma actualizado')
        .setDescription(`Idioma establecido: **${LANGUAGES[lang] || lang}**`)
        .setFooter({ text: `Cambiado por ${interaction.user.tag}` })],
    })
  },
}
