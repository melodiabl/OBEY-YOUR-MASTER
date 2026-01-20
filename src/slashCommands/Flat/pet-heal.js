const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { healPet } = require('../../systems').pets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  MODULE: 'pets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('pet-heal')
    .setDescription('Cura a tu mascota (cuesta dinero)'),

  async execute (client, interaction) {
    try {
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
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} ${e.message}`, ephemeral: true })
    }
  }
}
