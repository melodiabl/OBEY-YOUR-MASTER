const { SlashCommandBuilder } = require('discord.js')
const weather = require('weather-js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, errorEmbed, headerLine } = require('../../core/ui/uiKit')

function fetchWeather (city) {
  return new Promise((resolve, reject) => {
    weather.find({ search: city, degreeType: 'C' }, function (err, result) {
      if (err) return reject(err)
      if (!result || !result.length) return resolve(null)
      return resolve(result[0])
    })
  })
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Muestra el clima de una ciudad')
    .addStringOption(option =>
      option.setName('ciudad')
        .setDescription('Nombre de la ciudad')
        .setRequired(true)
        .setMaxLength(80)
    ),

  async execute (client, interaction) {
    const city = interaction.options.getString('ciudad', true)
    await interaction.deferReply({ ephemeral: true })

    const ui = await getGuildUiConfig(client, interaction.guild.id)
    const data = await fetchWeather(city).catch(() => null)

    if (!data?.current || !data?.location) {
      const err = errorEmbed({
        ui,
        system: 'utility',
        title: 'No encontré esa ubicación',
        reason: 'No se pudo encontrar el clima para esa ubicación.',
        hint: `Prueba con: ${Format.inlineCode('Ciudad, País')}`
      })
      return interaction.editReply({ embeds: [err] })
    }

    const current = data.current
    const location = data.location

    const e = embed({
      ui,
      system: 'utility',
      kind: 'info',
      title: `${Emojis.info} Clima`,
      description: [
        headerLine(Emojis.utility, String(current.observationpoint || city)),
        `${Emojis.dot} **Estado:** ${Format.bold(String(current.skytext || 'N/A'))}`,
        `${Emojis.dot} **Temperatura:** ${Format.inlineCode(`${current.temperature}°C`)}`,
        `${Emojis.dot} **Sensación:** ${Format.inlineCode(`${current.feelslike}°C`)}`,
        `${Emojis.dot} **Viento:** ${Format.inlineCode(String(current.winddisplay || 'N/A'))}`,
        `${Emojis.dot} **Humedad:** ${Format.inlineCode(String(current.humidity || 'N/A') + '%')}`,
        `${Emojis.dot} **Zona horaria:** ${Format.inlineCode(`UTC${location.timezone}`)}`
      ].join('\n'),
      thumbnail: current.imageUrl || undefined,
      signature: 'Clima en tiempo real'
    })

    return interaction.editReply({ embeds: [e] })
  }
}

