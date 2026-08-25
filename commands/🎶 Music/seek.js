const { fx, err, E } = require('../../handlers/music/responses')
function parseTime(str) {
  if (!str) return null
  const parts = str.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return (parts[0]*3600 + parts[1]*60 + parts[2]) * 1000
  if (parts.length === 2) return (parts[0]*60 + parts[1]) * 1000
  return parts[0] * 1000
}
module.exports = {
  name: 'seek', category: '🎶 Music',
  aliases: [],
  description: 'Salta al tiempo indicado (mm:ss o segundos)',
  usage: 'seek <tiempo>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const ms = parseTime(args[0])
    if (ms === null) return message.reply({ embeds: [err('Formato inválido. Usa `mm:ss` o segundos.')] }).catch(() => {})
    await client.music.seek(guildId, ms).catch(() => {})
    return message.reply({ embeds: [fx(E.clock, `Saltado a \`${args[0]}\``)] }).catch(() => {})
  },
}
