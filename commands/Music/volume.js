const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'volume', category: 'Music',
  aliases: ['vol', 'v'],
  description: 'Ajusta el volumen (0-200)',
  usage: 'volume <0-200>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.currentTrack) return message.reply({ embeds: [err('No hay música reproduciéndose.')] }).catch(() => {})
    const vol = Number(args[0])
    if (!Number.isInteger(vol) || vol < 0 || vol > 200) return message.reply({ embeds: [err('Ingresa un número entre **0** y **200**.')] }).catch(() => {})
    try {
      await client.music.setVolume(guildId, vol)
    } catch {
      return message.reply({ embeds: [err('No se pudo cambiar el volumen. Inténtalo de nuevo.')] }).catch(() => {})
    }
    const emoji = vol === 0 ? E.volDown : vol >= 100 ? E.volUp : E.volDown
    return message.reply({ embeds: [fx(emoji, `Volumen ajustado a **${vol}%**`)] }).catch(() => {})
  },
}
