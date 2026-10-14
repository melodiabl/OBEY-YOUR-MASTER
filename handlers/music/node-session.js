const { snapshot } = require('./sessions')
const { trackOnNode } = require('./node-search')
async function switchSession(client, guildId, target, preference, { persist, playTrack, emitState, scheduleRestore, settleVolume }) {
  const state = client.music.getState(guildId)
  const oldPreference = state.nodePreference || 'auto'
  const previousPlayer = client.shoukaku.players.get(guildId)
  const previousNode = previousPlayer?.node
  const oldStatus = state.status
  state.nodeTransition = true
  await settleVolume?.(guildId)
  const saved = JSON.parse(JSON.stringify(snapshot(state)))
  const restoreState = () => Object.assign(state, { ...saved, nodePreference: oldPreference, status: oldStatus, lastPosition: saved.position, startedAt: saved.paused ? null : Date.now() - saved.position })
  async function resume(node, track) {
    client.nodePool.pin(guildId, node.name)
    state.reconnectVoice = true
    const player = await client.music.joinChannel(guildId, saved.voiceChannelId, saved.textChannelId)
    Object.assign(state, { ...saved, currentTrack: track || saved.currentTrack, lastPosition: saved.position, startedAt: saved.paused ? null : Date.now() - saved.position, paused: Boolean(saved.paused) })
    await player.setGlobalVolume(saved.volume)
    if (track) await playTrack(player, state, track.encoded, { position: saved.position, paused: Boolean(saved.paused) })
    if (saved.filter === 'custom' && saved.customFilters) await player.setFilters(saved.customFilters)
    else if (saved.filter && saved.filter !== 'none') await client.music.setFilter(guildId, saved.filter)
    state.status = track ? saved.paused ? 'paused' : 'playing' : 'idle'
    state.reconnectVoice = false
    return player
  }
  try {
    if (previousPlayer && previousNode !== target) {
      const track = saved.currentTrack ? await trackOnNode(saved.currentTrack, target) : null
      if (client._shuttingDown) throw new Error('node_change_cancelled')
      await resume(target, track)
    }
    await persist(guildId, { ...state, nodePreference: preference })
    state.nodePreference = preference
    client.nodePool.unpin(guildId)
    state.nodeTransition = false
    emitState(guildId)
    if (state.currentTrack) await client.music.sendNowPlaying(guildId, state.currentTrack).catch(() => {})
    return client.nodePool.view(guildId)
  } catch {
    restoreState()
    if (previousPlayer && previousNode && client.shoukaku.players.get(guildId)?.node !== previousNode) {
      try { await resume(previousNode, saved.currentTrack) } catch { restoreState(); state.status = 'recovering'; scheduleRestore() }
    }
    client.nodePool.unpin(guildId)
    throw new Error('node_change_failed')
  } finally {
    state.nodeTransition = false
  }
}
module.exports = { switchSession }
