// Centro de Ayuda estilo Soundy (slash /info help). Lógica compartida en handlers/helpui.js.
const { ActionRowBuilder } = require('discord.js')
const { getCategories, homeEmbed, buildMenu, commandDetail, attachCollector } = require('../../handlers/helpui')

module.exports = {
  name: 'help',
  description: 'Centro de ayuda interactivo con todas las categorías y comandos',
  options: [
    { String: { name: 'comando', description: 'Ver los detalles de un comando concreto (opcional)', required: false } },
  ],
  run: async (client, interaction) => {
    let prefix = process.env.PREFIX || '!'
    try { const s = client.settings?.get(interaction.guild.id); if (s?.prefix) prefix = s.prefix } catch {}

    const q = interaction.options.getString('comando')
    if (q) {
      const cmd = client.commands.get(q.toLowerCase()) || client.commands.get(client.aliases.get(q.toLowerCase()))
      if (cmd) return interaction.reply({ embeds: [commandDetail(client, cmd, prefix)] }).catch(() => {})
    }

    const categories = getCategories(client)
    const menu = buildMenu(categories)
    const home = homeEmbed(client, interaction.user.id, categories, prefix)

    await interaction.reply({ embeds: [home], components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => {})
    const msg = await interaction.fetchReply().catch(() => null)
    if (!msg) return
    attachCollector(client, msg, interaction.user.id, prefix, home, menu)
  },
}
