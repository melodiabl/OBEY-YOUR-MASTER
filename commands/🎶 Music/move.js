const { fx, err, E } = require('../../handlers/music/responses')
module.exports = {
  name: 'move', category: '🎶 Music',
  aliases: ['mv'],
  description: 'Mueve una canción en la cola',
  usage: 'move <desde> <hasta>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message, args) => {
    const guildId = message.guild.id
    const mstate  = client.music?.getState(guildId)
    if (!mstate?.queue?.length) return message.reply({ embeds: [err('La cola está vacía.')] }).catch(() => {})
    const from = parseInt(args[0]), to = parseInt(args[1])
    if (isNaN(from) || isNaN(to)) return message.reply({ embeds: [err('Uso: `move <desde> <hasta>`')] }).catch(() => {})
    let failed = false
    await client.music.move(guildId, from, to).catch(e => { failed = true; message.reply({ embeds: [err(e.message)] }).catch(() => {}) })
    if (!failed) return message.reply({ embeds: [fx(E.folder, `Pista movida de **#${from}** a **#${to}**`)] }).catch(() => {})
  },
}
