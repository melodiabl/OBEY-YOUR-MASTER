const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Hazle una pregunta a la IA del bot')
    .addStringOption(option => 
      option.setName('pregunta')
        .setDescription('Lo que quieres preguntar')
        .setRequired(true)),

  async execute(client, interaction) {
    const prompt = interaction.options.getString('pregunta');
    
    // Verificar si la API KEY está configurada
    if (!process.env.OPENAI_API_KEY) {
      return interaction.reply({ content: '❌ El sistema de IA no está configurado (Falta OPENAI_API_KEY).', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Eres OBEY YOUR MASTER, un bot de Discord útil, divertido y un poco autoritario pero amigable. Responde en español." },
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
      });

      const answer = response.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setTitle('🤖 Respuesta de la IA')
        .setColor('LuminousVividPink')
        .addFields(
          { name: 'Pregunta', value: prompt.length > 1024 ? prompt.substring(0, 1021) + '...' : prompt },
          { name: 'Respuesta', value: answer.length > 1024 ? answer.substring(0, 1021) + '...' : answer }
        )
        .setFooter({ text: 'Potenciado por OpenAI' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Hubo un error al procesar tu pregunta con la IA.' });
    }
  }
};
