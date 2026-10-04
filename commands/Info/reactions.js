const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'reactions', category: 'Info', aliases: ['reactionlist'],
  description: 'Lista los comandos de reacciones disponibles',
  run: async (client, message) => {
    const names = [...client.commands.values()].filter(command => /Anime|Emotion/i.test(command.category || '')).map(command => command.name).sort()
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle('Reacciones').setDescription(names.join(' · ').slice(0, 4000) || 'No hay reacciones disponibles.')] })
  },
}
