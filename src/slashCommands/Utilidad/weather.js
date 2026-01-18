const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const weather = require('weather-js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Muestra el clima de una ciudad')
    .addStringOption(option =>
      option.setName('ciudad')
        .setDescription('Nombre de la ciudad')
        .setRequired(true)),

  async execute (client, interaction) {
    const city = interaction.options.getString('ciudad')

    weather.find({ search: city, degreeType: 'C' }, function (err, result) {
      if (err || !result || result.length === 0) {
        return interaction.reply({ content: 'No se pudo encontrar el clima para esa ubicación.', ephemeral: true })
      }

      const current = result[0].current
      const location = result[0].location

      const embed = new EmbedBuilder()
        .setTitle(`Clima en ${current.observationpoint}`)
        .setDescription(`**${current.skytext}**`)
        .setThumbnail(current.imageUrl)
        .setColor('Aqua')
        .addFields(
          { name: 'Temperatura', value: `${current.temperature}°C`, inline: true },
          { name: 'Sensación Térmica', value: `${current.feelslike}°C`, inline: true },
          { name: 'Viento', value: current.winddisplay, inline: true },
          { name: 'Humedad', value: `${current.humidity}%`, inline: true },
          { name: 'Zona Horaria', value: `UTC${location.timezone}`, inline: true }
        )
        .setTimestamp()

      interaction.reply({ embeds: [embed] })
    })
  }
}
