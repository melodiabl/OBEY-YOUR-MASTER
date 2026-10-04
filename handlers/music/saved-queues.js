const { canonicalTrack } = require('./playlist-repository')
const aliases = { removesong: 'removetrack', mix: 'shuffle', removeduplicates: 'removedupes', listall: 'showall', show: 'showall', queue: 'showall', list: 'showall', cs: 'createsave', save: 'createsave', remove: 'delete', del: 'delete', load: 'play', p: 'play', add: 'play', details: 'showdetails' }
const names = ['create', 'addcurrenttrack', 'addcurrentqueue', 'removetrack', 'removedupes', 'showall', 'showdetails', 'createsave', 'delete', 'play', 'shuffle']
function validateName(name) {
  if (!name || name.length > 10 || name.split('.').some(part => !part || ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('Indica un nombre válido de hasta 10 caracteres.')
  return name
}
function tracksForQueue(state, currentOnly = false) {
  const tracks = [state.currentTrack, ...(currentOnly ? [] : state.queue || [])].filter(Boolean).map(canonicalTrack).filter(Boolean)
  if (!tracks.length) throw new Error('No hay canciones para guardar.')
  return tracks.map(track => ({ title: track.title, url: track.uri, author: track.author, duration: track.duration, artworkUrl: track.artworkUrl, sourceName: track.sourceName }))
}
function listNames(value, prefix = '') {
  return Object.entries(value || {}).flatMap(([key, item]) => {
    if (['_id', 'userId', 'createdAt', 'updatedAt', '__v', 'TEMPLATEQUEUEINFORMATION'].includes(key)) return []
    const name = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(item) || item?.TEMPLATEQUEUEINFORMATION) return [name]
    return item && typeof item === 'object' ? listNames(item, name) : []
  })
}
async function execute(client, context, args) {
  const action = aliases[String(args[0] || '').toLowerCase()] || String(args[0] || '').toLowerCase()
  if (!names.includes(action)) throw new Error(`Usa savedqueue ${names.join(' / ')} <nombre>.`)
  const store = client.queuesaves, userId = context.user.id
  if (action === 'showall') return listNames(store.get(userId)).map(name => `📋 ${name}`).join('\n') || 'No tenés colas guardadas.'
  const name = validateName(args[1])
  const existing = store.get(userId, name)
  const tracks = Array.isArray(existing) ? [...existing] : []
  if (['create', 'createsave'].includes(action)) {
    if (existing !== null && existing !== undefined) throw new Error('Ya existe una cola con ese nombre.')
  } else if (existing === null || existing === undefined) throw new Error('No existe esa cola guardada.')
  const state = client.music.getState(context.guildId)
  let result
  switch (action) {
    case 'showdetails': return tracks.map((track, index) => `${index + 1}. ${track.title || 'Sin título'}`).join('\n').slice(0, 3900) || 'Esta cola está vacía.'
    case 'create': result = []; break
    case 'createsave': result = tracksForQueue(state); break
    case 'addcurrenttrack': result = [...tracks, ...tracksForQueue(state, true)]; break
    case 'addcurrentqueue': result = [...tracks, ...tracksForQueue(state)]; break
    case 'removetrack': {
      const index = Number(args[2]) - 1
      if (!Number.isInteger(index) || index < 0 || index >= tracks.length) throw new Error('Indica una posición válida de la cola guardada.')
      tracks.splice(index, 1); result = tracks; break
    }
    case 'removedupes': {
      const seen = new Set()
      result = tracks.filter(track => { const key = track.url || track.uri; if (seen.has(key)) return false; seen.add(key); return true }); break
    }
    case 'shuffle': {
      for (let index = tracks.length - 1; index > 0; index--) { const target = require('node:crypto').randomInt(index + 1); [tracks[index], tracks[target]] = [tracks[target], tracks[index]] }
      result = tracks; break
    }
    case 'delete': {
      // SyncMap supports deleting a complete row; update the user document to remove only this queue.
      store.delete(userId, name)
      await store.flush()
      return `Cola **${name}** eliminada.`
    }
    case 'play': {
      if (!context.voiceChannelId) throw new Error('Únete a un canal de voz.')
      if (state.voiceChannelId && state.voiceChannelId !== context.voiceChannelId) throw new Error('Únete al canal de voz del bot.')
      const playable = tracks.map(track => {
        const canonical = canonicalTrack(track)
        return canonical && { info: { ...canonical.info, title: canonical.title, author: canonical.author, length: canonical.duration, artworkUrl: canonical.artworkUrl, requester: context.user.username, requesterId: context.user.id } }
      }).filter(Boolean)
      if (!playable.length) throw new Error('La cola está vacía o no contiene enlaces válidos.')
      await client.music.joinChannel(context.guildId, context.voiceChannelId, context.textChannelId)
      await client.music.enqueue(context.guildId, playable)
      return `${playable.length} canciones de **${name}** añadidas.`
    }
  }
  store.set(userId, result, name)
  await store.flush()
  return `Cola **${name}** guardada: ${result.length} canciones.`
}
module.exports = { execute, validateName, tracksForQueue, listNames }
