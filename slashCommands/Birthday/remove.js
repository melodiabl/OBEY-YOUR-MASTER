const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const Birthday = require(`${process.cwd()}/database/schemas/BirthdaySchema`)
module.exports = {
  name: 'remove',
  description: 'Borra tu fecha de cumpleaños',
  options: [],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    const deleted = await Birthday.findOneAndDelete({ userId: interaction.user.id, guildId: interaction.guild.id })
    return interaction.reply({
      embeds: [deleted ? ok(obeyUi.owned('🗑️ Tu cumpleaños ha sido borrado.')) : err(obeyUi.owned('❌ No tenías ningún cumpleaños guardado.'))],
      ephemeral: true,
    })
  },
}
