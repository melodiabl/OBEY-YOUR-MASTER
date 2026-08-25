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
    client.settings.ensure(gid, { welcome: { channel: 'nochannel' } }, 'welcome')
    client.settings.set(gid, msg, 'welcome.msg')

    const preview = msg
      .replace('{user}', `${interaction.user}`)
      .replace('{username}', interaction.user.username)
      .replace('{guild}', interaction.guild.name)

    await interaction.reply({
      embeds: [
        ok(`✅ Mensaje de bienvenida actualizado.\n\n**Vista previa:**\n${preview}`)
          .setFooter({ text: 'Variables: {user} {username} {guild}' })
      ],
    })
  },
}
