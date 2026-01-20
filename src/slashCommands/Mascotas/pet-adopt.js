const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { adoptPet, PET_TYPES } = require('../../systems').pets
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pet-adopt')
    .setDescription('Adopta una mascota para que te acompañe')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de tu mascota')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tipo')
        .setDescription('Tipo de mascota')
        .setRequired(true)
        .addChoices(
          ...PET_TYPES.map(t => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t }))
        )),

  async execute (client, interaction) {
    const name = interaction.options.getString('nombre')
    const type = interaction.options.getString('tipo')

    try {
      const pet = await adoptPet({ client, userID: interaction.user.id, type, name })

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.pet} ¡Nueva Mascota Adoptada!`)
        .setDescription(`Has adoptado a ${Format.bold(pet.name)}, un hermoso ${Format.bold(pet.type)}.`)
        .setColor('Green')
        .addFields(
          { name: 'Salud', value: Format.progressBar(pet.health, 100), inline: true },
          { name: 'Felicidad', value: Format.progressBar(pet.happiness, 100), inline: true }
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
