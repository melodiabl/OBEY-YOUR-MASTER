const obeyUi = require("../../handlers/assets/system")
const obeyMeta = require("../../handlers/presentation/metadata")
const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'usertag',
  description: 'Muestra el tag/username de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario (por defecto tú)', required: false } },
  ],

  run: async (client, interaction) => {
    const user    = interaction.options.getUser('usuario') || interaction.user
    const member  = interaction.guild.members.cache.get(user.id)
    const display = member?.displayName ?? user.username

    await interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(0x5865F2)
          .setAuthor(obeyMeta.asAuthor({ name: user.username, iconURL: user.displayAvatarURL() }))
          .addFields(
            { name: obeyUi.owned('🏷️ Username'),       value: `\`${user.username}\``, inline: true },
            { name: obeyUi.owned('🪪 ID'),             value: `\`${user.id}\``,       inline: true },
            { name: obeyUi.owned('📛 Nick en server'), value: `\`${display}\``,       inline: true },
          ),
      ],
    })
  },
}
