const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'canal',
  description: 'Establece el canal de bienvenida rápidamente',
  memberpermissions: ['ManageGuild'],
  options: [
    { Channel: { name: 'canal', description: 'Canal donde se enviarán las bienvenidas', required: true } },
  ],

  run: async (client, interaction) => {
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    const channel = interaction.options.getChannel('canal')
    if (!channel.isTextBased())
      return interaction.reply({ embeds: [err('❌ Debe ser un canal de texto.')], ephemeral: true })

    const gid = interaction.guild.id
    try { await require('../../handlers/welcome-access').assertWelcomeChannel(interaction.guild,interaction.user.id,channel.id);await require('../../handlers/config-service').saveWelcomeChannel(client.settings,gid,channel.id) }
    catch { return interaction.reply({embeds:[err('❌ No se pudo guardar el canal de bienvenida. Inténtalo de nuevo.')],ephemeral:true}) }

    await interaction.reply({
      embeds: [ok(`✅ Canal de bienvenida establecido en ${channel}.\nUsa \`!setup-welcome\` para configurar la tarjeta y el mensaje.`)],
    })
  },
}
