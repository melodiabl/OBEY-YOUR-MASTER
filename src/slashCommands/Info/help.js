const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, headerLine, embed } = require('../../core/ui/uiKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panel de ayuda visual y comandos'),

  async execute (client, interaction) {
    const ui = await getGuildUiConfig(client, interaction.guild.id)

    const categories = [
      { label: 'Información', value: 'Info', emoji: Emojis.info, description: 'Comandos generales' },
      { label: 'Moderación', value: 'Moderacion', emoji: Emojis.moderation, description: 'Acciones y sanciones' },
      { label: 'Música', value: 'music', emoji: Emojis.music, description: 'Reproducción y cola' },
      { label: 'Economía', value: 'economy', emoji: Emojis.economy, description: 'Balance, tienda e ítems' },
      { label: 'Diversión', value: 'funny', emoji: Emojis.fun, description: 'Juegos y entretenimiento' },
      { label: 'Tickets', value: 'Sistemas', emoji: Emojis.ticket, description: 'Soporte y tickets' },
      { label: 'Utilidad', value: 'Utilidad', emoji: Emojis.utility, description: 'Comandos útiles' },
      { label: 'Configuración', value: 'Config', emoji: Emojis.system, description: 'Ajustes del servidor' }
    ]

    const helpEmbed = embed({
      ui,
      system: 'info',
      kind: 'info',
      title: `${Emojis.crown} OBEY YOUR MASTER`,
      description: [
        headerLine(Emojis.info, 'Panel de ayuda'),
        `${Emojis.dot} Navega por categoría con el menú.`,
        `${Emojis.dot} Tip: muchos comandos tienen *subcomandos* (ej: ${Format.inlineCode('/auth role set')}).`
      ].join('\n'),
      fields: [
        {
          name: `${Emojis.stats} Resumen`,
          value: `${Emojis.dot} Comandos cargados: ${Format.inlineCode(client.slashCommands.size)}\n${Emojis.dot} Usuarios en caché: ${Format.inlineCode(client.users.cache.size)}`,
          inline: true
        },
        {
          name: `${Emojis.system} Formato`,
          value: `${Emojis.dot} Slash: ${Format.inlineCode('/')}\n${Emojis.dot} Ayuda: ${Format.inlineCode('/help')}`,
          inline: true
        }
      ],
      footer: 'UX premium: respuestas claras, jerarquía visual y errores amigables'
    })

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Selecciona una categoría…')
      .addOptions(categories.map(cat => ({
        label: cat.label,
        value: cat.value,
        emoji: cat.emoji,
        description: cat.description
      })))

    const row = new ActionRowBuilder().addComponents(menu)
    return interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true })
  }
}
