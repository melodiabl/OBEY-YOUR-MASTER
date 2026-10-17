const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'canal',
  description: 'Establece el canal de bienvenida rápidamente',
  memberpermissions: ['ManageGuild'],
  options: [
    { Channel: { name: 'canal', description: 'Canal donde se enviarán las bienvenidas', required: true } },
  ],

  run: async (client, interaction) => {
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))

    const channel = interaction.options.getChannel('canal')
    if (!channel.isTextBased())
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debe ser un canal de texto.'))], ephemeral: true })

    const gid = interaction.guild.id
    await interaction.deferReply({ ephemeral: true })
    try { await client.welcomeConfiguration.savePublished({guildId:gid,actorId:interaction.user.id},{patch:{channelId:channel.id}}) }
    catch { return interaction.editReply({embeds:[err('❌ No se pudo guardar el canal de bienvenida. Inténtalo de nuevo.')]}) }

    await interaction.editReply({
      embeds: [ok(`${obeyUi.markup("icon.success")} Canal de bienvenida establecido en ${channel}.\nUsa \`!setup-welcome\` para configurar la tarjeta y el mensaje.`)],
    })
  },
}
