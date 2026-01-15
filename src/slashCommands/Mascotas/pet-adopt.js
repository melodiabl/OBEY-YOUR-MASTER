const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserSchema = require('../../database/schemas/UserSchema');

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
          { name: '🐶 Perro', value: 'perro' },
          { name: '🐱 Gato', value: 'gato' },
          { name: '🐉 Dragón', value: 'dragon' },
          { name: '🐹 Hamster', value: 'hamster' }
        )),

  async execute(client, interaction) {
    const name = interaction.options.getString('nombre');
    const type = interaction.options.getString('tipo');
    
    let userData = await UserSchema.findOne({ userID: interaction.user.id });
    if (!userData) userData = new UserSchema({ userID: interaction.user.id });

    if (userData.pet && userData.pet.name) {
      return interaction.reply({ content: `Ya tienes una mascota llamada **${userData.pet.name}**. ¡Cuídala bien!`, ephemeral: true });
    }

    userData.pet = {
      name: name,
      type: type,
      health: 100,
      lastFed: new Date()
    };

    await userData.save();

    const embed = new EmbedBuilder()
      .setTitle('🐾 ¡Nueva Mascota Adoptada!')
      .setDescription(`Has adoptado a **${name}**, un hermoso **${type}**.`)
      .setColor('Random')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
