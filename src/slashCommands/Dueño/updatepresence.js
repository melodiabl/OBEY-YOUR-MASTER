const { SlashCommandBuilder, EmbedBuilder, ActivityType, PresenceUpdateStatus } = require('discord.js')
const { abbreviateNumber } = require('../../helpers/helpers')
const GuildDB = require('../../database/schemas/Guild.db')
const emojis = require('../../utils/emojis')
const formatter = require('../../utils/formatter')

module.exports = {
  OWNER: true,
  CMD: new SlashCommandBuilder()
    .setName('updatepresence')
    .setDescription('Actualiza la presencia del bot (Solo Owner)'),

  async execute (client, interaction) {
    const guildCount = new GuildDB().getGuildAllData().length

    client.user.setPresence({
      activities: [
        {
          name: `${abbreviateNumber(guildCount)} servers`,
          type: ActivityType.Watching
        }
      ],
      status: PresenceUpdateStatus.Online
    })

    const embed = new EmbedBuilder()
      .setTitle(formatter.title(emojis.system, 'Presencia Actualizada'))
      .setDescription(`${emojis.success} La presencia del bot ha sido actualizada correctamente.`)
      .addFields(
        { name: `${emojis.stats} Nueva Actividad`, value: formatter.inlineCode(`Watching ${abbreviateNumber(guildCount)} servers`), inline: true },
        { name: `${emojis.online} Estado`, value: formatter.inlineCode('Online'), inline: true }
      )
      .setColor('Green')
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  }
}
