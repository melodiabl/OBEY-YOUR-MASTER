const { EmbedBuilder } = require('discord.js')
const { database } = require('./database')
function reply(message, text) { return message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription(text)] }) }
async function related(client, message, args, add) {
  const state = client.music.getState(message.guild.id)
  const seed = state.currentTrack?.info || state.currentTrack
  const query = args.join(' ') || seed?.author || seed?.title
  if (!query) throw new Error('Indica un artista o reproduce una canción primero.')
  const result = await client.music.search(`ytsearch:${query}`, message.author)
  const excluded = new Set([seed?.uri, ...state.queue.map(track => (track.info || track).uri)])
  const tracks = (result?.tracks || []).filter(track => !excluded.has((track.info || track).uri)).slice(0, 5)
  if (!tracks.length) throw new Error('No encontré otras canciones para esa búsqueda.')
  if (!add) return reply(message, tracks.map((track, index) => `${index + 1}. **${(track.info || track).title}**`).join('\n'))
  const channel = message.member?.voice?.channel
  if (!channel) throw new Error('Únete a un canal de voz.')
  await client.music.joinChannel(message.guild.id, channel.id, message.channel.id)
  await client.music.enqueue(message.guild.id, tracks)
  return reply(message, `🎵 ${tracks.length} canciones añadidas a la cola.`)
}
async function playlist(client, message, args) {
  const action = args.shift() || 'list'
  const allowed = ['list', 'create', 'show', 'delete', 'play', 'share']
  if (!allowed.includes(action)) throw new Error(`Usa playlist ${allowed.join(' / ')} <nombre>.`)
  const command = require(`../../slashCommands/Playlist/${action}`)
  const name = args.join(' ').trim()
  if (action !== 'list' && !name) throw new Error('Indica el nombre de la playlist.')
  let response
  const interaction = {
    user: message.author, guild: message.guild, member: message.member, channel: message.channel, channelId: message.channel.id,
    options: { getString: () => name, getBoolean: () => true },
    deferReply: async () => { response = await message.reply('⏳ Procesando…') },
    reply: payload => message.reply(payload),
    editReply: payload => response ? response.edit(payload) : message.reply(payload),
  }
  return command.run(client, interaction)
}
module.exports = name => async (client, message, args = []) => {
  try {
    if (['pitch', 'speed', 'rate', 'equalizer'].includes(name)) {
      if (!args.length) throw new Error(`Usa ${name} ${name === 'equalizer' ? '<banda 0-14> <ganancia -0.25 a 1>' : '<valor 0.25 a 2>'}.`)
      await client.music.setAudioParameter(message.guild.id, name, Number(args[0]), Number(args[1]))
      return reply(message, `🎛️ ${name}: **${args.join(' ')}**`)
    }
    if (['playsc', 'playskipsc', 'searchsc'].includes(name)) throw new Error('SoundCloud está desactivado. Usa play o search con YouTube.')
    if (name === 'playlist') return await playlist(client, message, args)
    if (name === 'searchplaylist') {
      const playlists = await database.getPlaylists(message.author.id)
      const query = args.join(' ').toLowerCase()
      const matches = playlists.filter(item => item.name.toLowerCase().includes(query))
      return reply(message, matches.map(item => `📋 **${item.name}** · ${item.tracks.length} pistas`).join('\n').slice(0, 4000) || 'No encontré playlists guardadas.')
    }
    if (name === 'searchsimilar') return await related(client, message, args, false)
    if (['addsimilar', 'playmusicmix'].includes(name)) return await related(client, message, args, true)
    if (['radio', 'searchradio'].includes(name)) {
      const query = args.join(' ')
      if (!query) throw new Error('Indica una emisora o un enlace de radio.')
      const stations = /^https?:\/\//i.test(query) ? [{ name: 'Radio', url_resolved: query }] : await require('radio-browser').getStations({ by: 'name', searchterm: query, limit: 5, hidebroken: true })
      if (!stations.length) throw new Error('No encontré emisoras. También puedes usar el enlace directo.')
      if (name === 'searchradio') return reply(message, stations.map(station => `📻 **${station.name}**\n${station.url_resolved || station.url}`).join('\n').slice(0, 4000))
      args = [stations[0].url_resolved || stations[0].url]
    }
    if (name === 'playsongoftheday') args = ['ytsearch:top music hits']
    const voice = message.member?.voice?.channel
    if (!voice) throw new Error('Únete a un canal de voz.')
    if (!args.length) throw new Error('Indica una canción o un enlace.')
    const result = await client.music.play(message.guild.id, voice.id, message.channel.id, args.join(' '), message.author)
    const track = result?.result?.tracks?.[0]
    if (!track) throw new Error('No encontré una canción disponible para esa búsqueda.')
    return reply(message, `🎵 **${(track.info || track).title}** añadida.`)
  } catch (error) { return message.reply(`❌ ${error.message}`) }
}
