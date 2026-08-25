const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'lyrics',
  category: '🎶 Music',
  aliases: ['songlyrics', 'ly', 'tracklyrics'],
  description: 'Muestra la letra de la canción actual',
  usage: 'lyrics [título]',
  cooldown: 15,
  parameters: { type: 'music', activeplayer: true, previoussong: false },

  run: async (client, message, args) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack)
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})

    const info  = state.currentTrack.info || state.currentTrack
    const query = args.join(' ') || `${info.title || ''} ${info.author || ''}`

    const loading = await message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(`🔍 Buscando letra de **${(info.title || query).substring(0, 60)}**...`)] })

    try {
      const node = [...(client.shoukaku?.nodes?.values() || [])].find(n => n.state === 2)
      if (!node) throw new Error('No hay nodo Lavalink disponible.')

      const encoded = encodeURIComponent(query)
      const url = `http://${node.options.url}/v4/lyrics/search?query=${encoded}&source=genius`
      const res = await fetch(url, { headers: { Authorization: node.options.auth } })

      if (!res.ok) throw new Error(`Lavalink respondió ${res.status}`)
      const data = await res.json()

      const text = data?.text || data?.lyrics
      if (!text) throw new Error('No se encontraron letras.')

      const chunks = []
      for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000))

      await loading.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`🎤 ${(data.title || info.title || query).substring(0, 60)}`)
            .setDescription(chunks[0])
            .setFooter({ text: `Fuente: ${data.sourceUrl || 'Lavalink'} • pág 1/${chunks.length}` }),
        ],
      })
    } catch {
      await loading.edit({ embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription('⚠️ No se pudieron obtener las letras en este momento.')] }).catch(() => {})
    }
  },
}
