const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const { getGuildUiConfig } = require('../../core/ui/uiKit')
const { HELP_CATEGORIES, buildHelpHomeEmbed } = require('../../core/ui/help/helpCatalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Panel de ayuda visual (premium)'),

  async execute (client, interaction) {
    const ui = await getGuildUiConfig(client, interaction.guild.id)

    const helpEmbed = buildHelpHomeEmbed({ ui, client })

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Selecciona una categoría…')
      .addOptions(HELP_CATEGORIES.map(cat => ({
        label: cat.label,
        value: cat.key,
        emoji: cat.emoji,
        description: cat.description
      })))

    const row = new ActionRowBuilder().addComponents(menu)
    return interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true })
  }
}

