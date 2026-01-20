const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const Systems = require('../../systems')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sistemas')
    .setDescription('Verifica el estado de los sistemas del bot'),
  async execute (client, interaction) {
    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.system} Estado de los Sistemas`)
      .setColor('Green')
      .setDescription(Format.subtext('Todos los sistemas operativos y funcionando correctamente.'))
      .addFields(
        {
          name: `${Emojis.economy} Economía`,
          value: Systems.economy ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        },
        {
          name: `${Emojis.clan} Clanes`,
          value: Systems.clans ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        },
        {
          name: `${Emojis.level} Niveles`,
          value: Systems.levels ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        },
        {
          name: `${Emojis.music} Música`,
          value: client.shoukaku ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        },
        {
          name: `${Emojis.giveaway} Sorteos`,
          value: Systems.giveaways ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        },
        {
          name: `${Emojis.ticket} Tickets`,
          value: Systems.tickets ? `${Emojis.success} Activo` : `${Emojis.error} Inactivo`,
          inline: true
        }
      )
      .setFooter({ text: 'Sistemas Bot Core' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
