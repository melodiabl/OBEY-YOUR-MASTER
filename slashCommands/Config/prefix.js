const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'prefix',
  description: 'Cambiar el prefijo del bot en este servidor',
  memberpermissions: ['Administrator'],
  options: [
    { String: { name: 'prefijo', description: 'Nuevo prefijo (máx. 5 caracteres)', required: true } },
  ],

  run: async (client, interaction) => {
    const prefix = interaction.options.getString('prefijo')

    if (prefix.length > 5)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El prefijo no puede tener más de 5 caracteres.'), 4096))], ephemeral: true })
    if (prefix.includes(' '))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El prefijo no puede contener espacios.'), 4096))], ephemeral: true })

    client.settings.set(interaction.guild.id, prefix, 'prefix')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle(obeyUi.limit(obeyUi.owned('✅ Prefijo actualizado'), 256))
        .setDescription(obeyUi.limit(`El nuevo prefijo es \`${prefix}\`\nEjemplo: \`${prefix}help\``, 4096))
        .setFooter(obeyMeta.asFooter({ text: `Cambiado por ${interaction.user.tag}` }))],
    })
  },
}
