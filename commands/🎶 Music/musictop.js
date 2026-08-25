// Top/charts de música del servidor (canciones + oyentes), usando las stats v2.
const { EmbedBuilder } = require('discord.js')
const { database } = require('../../handlers/music/database')
const { config } = require('../../handlers/music/config')
const E = config.emoji

module.exports = {
  name: 'musictop',
  category: '🎶 Music',
  aliases: ['topmusic', 'charts', 'topcanciones'],
  description: 'Las canciones y oyentes más activos del servidor',
  usage: 'musictop',
  run: async (client, message) => {
    const [tracks, users] = await Promise.all([
      database.getTopTracks(message.guild.id, 10),
      database.getTopUsers(message.guild.id, 10),
    ])
    if (!tracks.length && !users.length) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`${E.music} Aún no hay estadísticas. ¡Reproduce música para empezar!`)] }).catch(() => {})
    }
    const medal = i => ['🥇', '🥈', '🥉'][i] || `\`${i + 1}.\``
    const trackLines = tracks.map((t, i) =>
      `${medal(i)} ${t.uri ? `[${(t.title || '?').slice(0, 42)}](${t.uri})` : (t.title || '?').slice(0, 42)} · \`${t.playCount}\``).join('\n') || '_Sin datos_'
    const userLines = users.map((u, i) => `${medal(i)} <@${u.userId}> · \`${u.playCount}\``).join('\n') || '_Sin datos_'

    const embed = new EmbedBuilder().setColor(0x00ff33)
      .setAuthor({ name: `Top de ${message.guild.name}`, iconURL: message.guild.iconURL() || undefined })
      .addFields(
        { name: `${E.music} Canciones más reproducidas`, value: trackLines.slice(0, 1024) },
        { name: `${E.user} Oyentes más activos`, value: userLines.slice(0, 1024) },
      )
      .setFooter({ text: 'Estadísticas en tiempo real' })
      .setTimestamp()
    message.reply({ embeds: [embed] }).catch(() => {})
  },
}
