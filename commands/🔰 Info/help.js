// Centro de Ayuda estilo Soundy (prefix). Lógica en handlers/helpui.js. Reemplaza al help clásico (help.js.bak).
const { ActionRowBuilder } = require('discord.js')
const { getCategories, homeEmbed, buildMenu, commandDetail, attachCollector } = require('../../handlers/helpui')

module.exports = {
  name: 'help',
  category: '🔰 Info',
  aliases: ['h', 'helpmenu', 'menu', 'ayuda', 'comandos', 'halp', 'hilfe', 'commandinfo'],
  description: 'Centro de ayuda interactivo con todas las categorías y comandos',
  usage: 'help [comando]',
  run: async (client, message, args, cmduser, text, prefix) => {
    if (args?.[0]) {
      const q = args[0].toLowerCase()
      const cmd = client.commands.get(q) || client.commands.get(client.aliases.get(q))
      if (cmd) return message.reply({ embeds: [commandDetail(client, cmd, prefix)] }).catch(() => {})
    }

    const categories = getCategories(client)
    const menu = buildMenu(categories)
    const home = homeEmbed(client, message.author.id, categories, prefix)

    const sent = await message.reply({ embeds: [home], components: [new ActionRowBuilder().addComponents(menu)] }).catch(e => {
      console.log('[help] reply error:', e?.message); return null
    })
    if (!sent) return
    attachCollector(client, sent, message.author.id, prefix, home, menu)
  },
}
