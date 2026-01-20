const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra la lista de comandos disponibles'),
  async execute (client, interaction) {
    const categories = [
      { label: 'Información', value: 'Info', emoji: Emojis.info, description: 'Comandos de información general' },
      { label: 'Economía', value: 'economy', emoji: Emojis.economy, description: 'Sistema de economía y juegos' },
      { label: 'Música', value: 'music', emoji: Emojis.music, description: 'Reproducción de música' },
      { label: 'Moderación', value: 'Moderacion', emoji: Emojis.moderation, description: 'Comandos de moderación' },
      { label: 'Diversión', value: 'funny', emoji: Emojis.fun, description: 'Comandos de entretenimiento' },
      { label: 'Mascotas', value: 'Mascotas', emoji: Emojis.pet, description: 'Sistema de mascotas' },
      { label: 'Matrimonio', value: 'marriage', emoji: Emojis.clan, description: 'Comandos de matrimonio' },
      { label: 'Utilidad', value: 'Utilidad', emoji: Emojis.utility, description: 'Comandos de utilidad' },
      { label: 'Configuración', value: 'Config', emoji: Emojis.system, description: 'Configuración del servidor' }
    ]

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.crown} OBEY YOUR MASTER - Panel de Ayuda`)
      .setDescription(`${Format.h3('¡Bienvenido!')}\nSelecciona una categoría en el menú de abajo para ver los comandos disponibles.`)
      .setColor('Gold')
      .addFields(
        { name: `${Emojis.stats} Estadísticas Rápidas`, value: `${Emojis.dot} Comandos: ${client.slashCommands.size}\n${Emojis.dot} Usuarios: ${client.users.cache.size}`, inline: true },
        { name: `${Emojis.system} Prefijo`, value: Format.inlineCode('/ (Slash)'), inline: true }
      )
      .setImage('https://i.imgur.com/example.png') // Opcional
      .setFooter({ text: 'Usa el menú desplegable para navegar' })
      .setTimestamp()

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Selecciona una categoría...')
      .addOptions(categories.map(cat => ({
        label: cat.label,
        value: cat.value,
        emoji: cat.emoji,
        description: cat.description
      })))

    const row = new ActionRowBuilder().addComponents(menu)

    await interaction.reply({ embeds: [embed], components: [row] })
  }
}
