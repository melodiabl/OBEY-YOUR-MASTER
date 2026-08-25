const { EmbedBuilder } = require('discord.js')
const https = require('node:https')

function fetchLyrics(title, artist) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ track_name: title, artist_name: artist || '' })
    const req = https.get(`https://lrclib.net/api/get?${params}`, { headers: { 'User-Agent': 'OBEY-Bot/1.0' } }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve(json.plainLyrics || json.syncedLyrics || null)
        } catch { resolve(null) }
      })
    })
    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}

function paginate(text, maxLen = 1800) {
  const lines = text.split('\n')
  const pages = []
  let current = ''
  for (const line of lines) {
    if ((current + '\n' + line).length > maxLen) {
      if (current) pages.push(current.trim())
      current = line
    } else {
      current += (current ? '\n' : '') + line
    }
  }
  if (current) pages.push(current.trim())
  return pages
}

module.exports = {
  name: 'lyrics',
  description: 'Muestra la letra de la canción actual o de una búsqueda',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [
    {
      String: {
        name: 'cancion',
        description: 'Nombre de la canción (vacío = canción actual)',
        required: false,
      },
    },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)

    await interaction.deferReply()

    let title, artist
    const query = interaction.options.getString('cancion')

    if (query) {
      const parts = query.split(' - ')
      title  = parts[1] || parts[0]
      artist = parts[1] ? parts[0] : ''
    } else {
      const state = client.music?.getState(interaction.guild.id)
      const track = state?.currentTrack
      if (!track) return interaction.editReply({ embeds: [err('❌ No hay música reproduciéndose. Usa `/lyrics cancion: nombre` para buscar.')] })
      const info = track.info || track
      title  = info.title  || track.title  || ''
      artist = info.author || track.author || ''
      title = title.replace(/\(Official\s*(Music|Audio|Video|Lyric\s*Video)?\s*\)/gi, '').replace(/\[.*?\]/g, '').trim()
    }

    if (!title) return interaction.editReply({ embeds: [err('❌ No se pudo obtener el título de la canción.')] })

    let lyrics = null
    try { lyrics = await fetchLyrics(title, artist) } catch {}
    if (!lyrics) { try { lyrics = await fetchLyrics(title, '') } catch {} }

    if (!lyrics) {
      return interaction.editReply({ embeds: [err(`❌ No se encontraron letras para **${title}**${artist ? ` — ${artist}` : ''}.`)] })
    }

    const pages = paginate(lyrics)
    const footer = pages.length > 1 ? `\n\n_Página 1/${pages.length} — usa el comando de nuevo para más_` : ''
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🎵 ${title}${artist ? ` — ${artist}` : ''}`)
      .setDescription(pages[0] + footer)

    await interaction.editReply({ embeds: [embed] })
  },
}
