// Operator-only, opt-in check in the guild explicitly chosen by the owner.
// Uses the production music service, real Discord voice and real node REST state.
const assert = require('node:assert/strict'), fs = require('node:fs')
const { PermissionFlagsBits, ChannelType } = require('discord.js')
const { snapshot } = require('../handlers/music/sessions')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(read, check, timeout = 45000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try { const value = await read(); if (check(value)) return value } catch {}
    await wait(500)
  }
  throw Error('voice_playback_timeout')
}
module.exports = async (client, guildId, file) => {
  assert.ok(guildId && file, 'public_check_configuration_missing')
  if (fs.existsSync(file)) return
  const report = { guildId, status: 'running', requestedPublic: process.env.LAVALINK_DEFAULT_NODE, audibleHumanConfirmed: false }
  const save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 })
  save()
  const music = client.music, guild = client.guilds.cache.get(guildId)
  let original, hadPlayer, modified = false, firstWorking
  const oldSend = music.sendNowPlaying, setup = require('../handlers/music/setup'), oldIdle = setup.resetToIdle
  const native = () => {
    const player = client.shoukaku.players.get(guildId)
    if (!player) throw Error('player_missing')
    return player.node.rest.getPlayer(guildId)
  }
  try {
    assert.ok(guild, 'chosen_guild_missing')
    assert.ok([...client.shoukaku.nodes.keys()].every(id => !id.startsWith('private-')), 'private_node_still_registered')
    const state = music.getState(guildId)
    assert.ok(!state.currentTrack && !state.queue.length, 'existing_playback_is_active')
    original = JSON.parse(JSON.stringify(snapshot(state))); hadPlayer = client.shoukaku.players.has(guildId)
    const me = await guild.members.fetchMe()
    const candidates = [...guild.channels.cache.values()].filter(channel => channel.type === ChannelType.GuildVoice && channel.id !== guild.afkChannelId &&
      channel.permissionsFor(me)?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]) &&
      ![...channel.members.values()].some(member => !member.user.bot))
    const channel = candidates.find(channel => channel.id === original.voiceChannelId) || candidates.find(channel => /music/i.test(channel.name.normalize('NFKD').replace(/\p{M}/gu, ''))) || candidates[0]
    assert.ok(channel, 'no_empty_accessible_voice_channel')
    report.voiceChannelId = channel.id; report.voiceChannelName = channel.name
    music.sendNowPlaying = (id, ...args) => id === guildId ? Promise.resolve() : oldSend.call(music, id, ...args)
    setup.resetToIdle = (c, id, ...args) => id === guildId ? Promise.resolve() : oldIdle(c, id, ...args)
    modified = true
    await music.setNodePreference(guildId, report.requestedPublic)
    const result = await music.search('ytsearch:Daft Punk Get Lucky', { id: 'public-node-check', username: 'Prueba de nodos' }, { guildId })
    assert.ok(result?.tracks?.length >= 2, 'music_search_unavailable')
    await music.joinChannel(guildId, channel.id, null)
    await music.setVolume(guildId, 0)
    await music.enqueue(guildId, result.tracks.slice(0, 2))
    const started = await until(native, player => player?.state?.connected && player.state.position >= 3000 && player.track)
    firstWorking = client.shoukaku.players.get(guildId).node.name
    report.primary = { nodeId: firstWorking, voiceConnected: true, position: started.state.position, serverReportedAudioProgress: true }
    await music.pause(guildId)
    const before = music.getState(guildId), queueLength = before.queue.length, sessionId = before.sessionId
    const savedPosition = before.lastPosition
    const previous = client.shoukaku.players.get(guildId)
    await music._recoverFailedTrack(guildId, previous, 'operator_failover_check')
    const moved = client.shoukaku.players.get(guildId)
    assert.notEqual(moved.node.name, firstWorking, 'backup_not_selected')
    assert.equal(before.queue.length, queueLength); assert.equal(before.volume, 0); assert.equal(before.paused, true); assert.equal(before.sessionId, sessionId)
    const paused = await until(native, player => player?.state?.connected && player.paused === true && player.volume === 0 && player.track && player.state.position >= savedPosition - 1500)
    assert.ok(paused.state.position >= savedPosition - 1500, 'saved_position_lost')
    await music.pause(guildId)
    const resumed = await until(native, player => player?.state?.connected && player.state.position > savedPosition + 1500 && player.track)
    report.backup = { nodeId: client.shoukaku.players.get(guildId).node.name, voiceConnected: true, position: resumed.state.position, queuePreserved: queueLength, pausePreserved: true, mutePreserved: true, sessionPreserved: true, serverReportedAudioProgress: true }
    report.status = 'passed'; report.selectedPublic = firstWorking
  } catch (error) {
    report.status = 'failed'; report.error = /^\w+$/.test(error.message) ? error.message : 'public_music_check_failed'
  } finally {
    if (modified) {
      try {
        await music.stop(guildId)
        Object.assign(music.getState(guildId), original, { currentTrack: null, queue: [], lastPosition: 0, startedAt: null, paused: false, nodeTransition: false })
        for (const id of client.shoukaku.nodes.keys()) client.nodePool.recover(id)
        if (hadPlayer) { await music.joinChannel(guildId, original.voiceChannelId, original.textChannelId); await music.setVolume(guildId, original.volume) }
        await music.setNodePreference(guildId, firstWorking || report.requestedPublic)
        report.cleanup = true
      } catch { report.cleanup = false; report.status = 'failed' }
    }
    music.sendNowPlaying = oldSend; setup.resetToIdle = oldIdle
    report.finishedAt = new Date().toISOString(); save()
    console.log('[PUBLIC_MUSIC_CHECK] ' + report.status)
  }
}
