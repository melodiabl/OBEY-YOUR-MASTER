const { EmbedBuilder } = require('discord.js')

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
    if (msg.length > 500)
      return interaction.reply({ embeds: [err('❌ El mensaje no puede superar 500 caracteres.')], ephemeral: true })

    const gid = interaction.guild.id
    try {
      await require('../../handlers/config-service').saveWelcomeMessage(client.settings, gid, msg)
    } catch {
      return interaction.reply({ embeds: [err('❌ No se pudo guardar el mensaje de bienvenida. Inténtalo de nuevo.')], ephemeral: true })
    }

    const preview = require('../../handlers/welcome-message').renderWelcomeMessage(msg, interaction.user, interaction.guild)

    await interaction.reply({
      embeds: [
        ok(`✅ Mensaje de bienvenida actualizado.\n\n**Vista previa:**\n${preview}`)
          .setFooter({ text: 'Variables: {user} {username} {guild}' })
      ],
    })
  },
}
