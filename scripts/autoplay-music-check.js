// Opt-in THZ release check: empty voice channel, muted audio, no text messages.
const assert = require('node:assert/strict'), fs = require('node:fs')
const { PermissionFlagsBits, ChannelType } = require('discord.js')
const { snapshot } = require('../handlers/music/sessions')
async function until(read, check, timeout = 60000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await read().catch(() => null)
    if (check(value)) return value
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw Error('autoplay_progress_timeout')
}
module.exports = async (client, guildId, file) => {
  assert.ok(guildId && file, 'missing_autoplay_check_configuration')
  if (fs.existsSync(file)) return
  const report = { status: 'running', guildId, muted: true, audibleHumanConfirmed: false }
  const save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 })
  save()
  const music = client.music, setup = require('../handlers/music/setup')
  const oldSend = music.sendNowPlaying, oldIdle = setup.resetToIdle
  let original, hadPlayer, modified = false
  const native = async () => {
    const player = client.shoukaku.players.get(guildId)
    return player ? player.node.rest.getPlayer(guildId) : null
  }
  try {
    const guild = client.guilds.cache.get(guildId), state = music.getState(guildId)
    assert.ok(guild, 'chosen_guild_missing')
    if (state.currentTrack || state.queue.length) { report.status = 'skipped'; report.reason = 'existing_playback'; return }
    original = JSON.parse(JSON.stringify(snapshot(state))); hadPlayer = client.shoukaku.players.has(guildId)
    const me = await guild.members.fetchMe()
    const channel = [...guild.channels.cache.values()].find(channel => channel.type === ChannelType.GuildVoice && channel.id !== guild.afkChannelId &&
      channel.permissionsFor(me)?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]) && ![...channel.members.values()].some(member => !member.user.bot))
    assert.ok(channel, 'no_empty_accessible_voice_channel')
    report.voiceChannelId = channel.id
    music.sendNowPlaying = (id, ...args) => id === guildId ? Promise.resolve() : oldSend.call(music, id, ...args)
    setup.resetToIdle = (c, id, ...args) => id === guildId ? Promise.resolve() : oldIdle(c, id, ...args)
    modified = true
    const result = await music.search('ytsearch:Rick Astley Never Gonna Give You Up', { id: 'autoplay-release-check', username: 'Verificación' }, { guildId })
    assert.ok(result?.tracks?.[0]?.encoded, 'seed_unavailable')
    await music.joinChannel(guildId, channel.id, null)
    await music.setVolume(guildId, 0)
    music.setAutoplay(guildId, true)
    await music.enqueue(guildId, [result.tracks[0]])
    await until(native, value => value?.state?.connected && value.volume === 0 && value.state.position >= 2000)
    const seed = music.getState(guildId).currentTrack, info = seed.info || seed
    assert.ok(info.length > 10000 && !info.isStream, 'seed_not_seekable')
    await music.seek(guildId, info.length - 1000)
    const next = await until(native, value => value?.state?.connected && value.volume === 0 && value.state.position >= 2000 &&
      music.getState(guildId).currentTrack !== seed && music.getState(guildId).currentTrack?.info?.requester === 'Autoplay')
    assert.notEqual(next.track.info.uri, info.uri)
    assert.equal(music.getState(guildId).queue.length, 0)
    report.status = 'passed'; report.nodeId = client.shoukaku.players.get(guildId).node.name
    report.naturalEnd = true; report.newRecording = true; report.queueEmpty = true; report.position = next.state.position
  } catch (error) { report.status = 'failed'; report.error = /^\w+$/.test(error.message) ? error.message : 'autoplay_live_check_failed' }
  finally {
    if (modified) {
      try {
        await music.stop(guildId)
        Object.assign(music.getState(guildId), original, { currentTrack: null, queue: [], lastPosition: 0, startedAt: null, paused: false, nodeTransition: false })
        if (hadPlayer) { await music.joinChannel(guildId, original.voiceChannelId, original.textChannelId); await music.setVolume(guildId, original.volume) }
        await music.setNodePreference(guildId, original.nodePreference || 'auto')
        report.cleanup = true
      } catch { report.cleanup = false; report.status = 'failed' }
    }
    music.sendNowPlaying = oldSend; setup.resetToIdle = oldIdle
    report.finishedAt = new Date().toISOString(); save()
    console.log('[AUTOPLAY_MUSIC_CHECK] ' + report.status)
  }
}
