const { SlashCommandBuilder } = require('discord.js')
const { buildPanelMessage } = require('../../core/ui/panels/panelKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Centro de control del bot (UX premium)')
    .addBooleanOption(o => o.setName('publico').setDescription('Mostrar en el canal (no efímero)').setRequired(false)),

  async execute (client, interaction) {
    const isPublic = Boolean(interaction.options.getBoolean('publico') || false)
    const payload = await buildPanelMessage({
      client,
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      view: 'home'
    })
    return interaction.reply({ ...payload, ephemeral: !isPublic })
  }
}
