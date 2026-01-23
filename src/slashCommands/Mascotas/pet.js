const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { adoptPet, feedPet, playWithPet, healPet, renamePet, PET_TYPES } = require('../../systems').pets
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Gestiona todo lo relacionado con tu mascota')
    .addSubcommand(sub =>
      sub.setName('adopt')
        .setDescription('Adopta una mascota para que te acompañe')
        .addStringOption(o => o.setName('nombre').setDescription('Nombre de tu mascota').setRequired(true))
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de mascota').setRequired(true)
          .addChoices(...PET_TYPES.map(t => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: t })))
        )
    )
    .addSubcommand(sub =>
      sub.setName('feed')
        .setDescription('Alimenta a tu mascota')
    )
    .addSubcommand(sub =>
      sub.setName('play')
        .setDescription('Juega con tu mascota')
    )
    .addSubcommand(sub =>
      sub.setName('heal')
        .setDescription('Cura a tu mascota (cuesta dinero)')
    )
    .addSubcommand(sub =>
      sub.setName('rename')
        .setDescription('Renombra tu mascota')
        .addStringOption(o => o.setName('nombre').setDescription('Nuevo nombre (2-20)').setRequired(true))
    ),

  async execute (client, interaction) {
    const subcommand = interaction.options.getSubcommand()

    try {
      if (subcommand === 'adopt') {
        const name = interaction.options.getString('nombre')
        const type = interaction.options.getString('tipo')
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
        return interaction.reply({ embeds: [embed] })
      }

      if (subcommand === 'feed') {
        const pet = await feedPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const embed = new EmbedBuilder()
          .setTitle('🍖 ¡Mascota Alimentada!')
          .setDescription(`Has alimentado a ${Format.bold(pet.name)}. ¡Se ve más feliz!`)
          .setColor('Green')
          .addFields(
            { name: 'Salud', value: Format.progressBar(pet.health, 100), inline: true },
            { name: 'Nivel', value: Format.inlineCode(pet.level.toString()), inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed] })
      }

      if (subcommand === 'play') {
        const pet = await playWithPet({ client, userID: interaction.user.id })
        const embed = new EmbedBuilder()
          .setTitle('🥎 ¡Hora de Jugar!')
          .setDescription(`Has jugado con ${Format.bold(pet.name)}. ¡Se divirtió mucho!`)
          .setColor('Orange')
          .addFields(
            { name: 'Felicidad', value: Format.progressBar(pet.happiness, 100), inline: true },
            { name: 'Nivel', value: Format.inlineCode(pet.level.toString()), inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed] })
      }

      if (subcommand === 'heal') {
        const res = await healPet({ client, guildID: interaction.guild.id, userID: interaction.user.id })
        const embed = new EmbedBuilder()
          .setTitle('💊 Mascota Curada')
          .setDescription(`Has curado a ${Format.bold(res.pet.name)}.`)
          .setColor('Blue')
          .addFields(
            { name: 'Costo', value: `${Emojis.money} ${Format.inlineCode(res.price.toString())}`, inline: true },
            { name: 'Salud', value: Format.progressBar(res.pet.health, 100), inline: true }
          )
          .setTimestamp()
        return interaction.reply({ embeds: [embed] })
      }

      if (subcommand === 'rename') {
        const name = interaction.options.getString('nombre', true)
        const pet = await renamePet({ client, userID: interaction.user.id, name })
        const embed = new EmbedBuilder()
          .setTitle('🏷️ Mascota Renombrada')
          .setDescription(`Ahora tu mascota se llama ${Format.bold(pet.name)}.`)
          .setColor('Random')
          .setTimestamp()
        return interaction.reply({ embeds: [embed] })
      }
    } catch (e) {
      return replyError(client, interaction, {
        system: 'games',
        reason: e?.message || 'Ocurrió un error.'
      }, { ephemeral: true })
    }
  }
}
