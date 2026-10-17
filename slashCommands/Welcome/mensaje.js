const { EmbedBuilder } = require('discord.js')
const { configSchema, configJsonSchema } = require('../../handlers/welcome/contract')

module.exports = {
  name: 'mensaje',
  description: 'Cambia el mensaje de bienvenida',
  memberpermissions: ['ManageGuild'],
  options: [
    { String: { name: 'mensaje', description: 'Mensaje ({user} = mención, {username} = nombre, {guild} = servidor)', required: true } },
  ],

  run: async (client, interaction) => {
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    const msg = interaction.options.getString('mensaje')
    if (!configSchema.shape.message.safeParse(msg).success)
      return interaction.reply({ embeds: [err(`❌ El mensaje no puede superar ${configJsonSchema.properties.message.maxLength} caracteres.`)], ephemeral: true })

    const gid = interaction.guild.id
    await interaction.deferReply({ ephemeral: true })
    try {
      await client.welcomeConfiguration.savePublished({guildId:gid,actorId:interaction.user.id},{patch:{message:msg}})
    } catch {
      return interaction.editReply({ embeds: [err('❌ No se pudo guardar el mensaje de bienvenida. Inténtalo de nuevo.')] })
    }

    const preview = require('../../handlers/welcome-message').renderWelcomeMessage(msg, interaction.user, interaction.guild)

    await interaction.editReply({
      embeds: [
        ok(`✅ Mensaje de bienvenida actualizado.\n\n**Vista previa:**\n${preview}`)
          .setFooter({ text: 'Variables: {user} {username} {guild}' })
      ],
    })
  },
}
