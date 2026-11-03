const { PermissionFlagsBits: F } = require('discord.js')
const { commandDenial } = require('./permissions')
const voiceFailure = code => Object.assign(new Error(code), { code: 'music_voice_' + code })
const id = value => typeof value === 'string' && /^\d{17,20}$/.test(value)

async function authorizeVoice(client, guildId, request) {
  if (!id(guildId) || !id(request?.actorId) || !id(request.voiceChannelId) || request.textChannelId != null && !id(request.textChannelId) ||
      !['join', 'moveme', 'reconnect'].includes(request.command)) throw voiceFailure('invalid')
  if (client._shuttingDown || client._dbReady === false) throw voiceFailure('unavailable')
  const guild = client.guilds?.cache?.get(guildId)
  if (!guild || guild.available === false) throw voiceFailure('access')
  const [member, bot, channel] = await Promise.all([
    guild.members.fetch({ user: request.actorId, force: true }), guild.members.fetchMe({ force: true }),
    guild.channels.fetch(request.voiceChannelId, { force: true }),
  ])
  if (member?.id !== request.actorId || member.guild?.id !== guildId || bot?.id !== client.user.id || bot.guild?.id !== guildId ||
      channel?.id !== request.voiceChannelId || channel.guildId !== guildId || !channel.isVoiceBased?.()) throw voiceFailure('access')
  if (member.voice?.channelId !== channel.id || !channel.permissionsFor(member)?.has([F.ViewChannel, F.Connect])) throw voiceFailure('actor')
  if (!channel.permissionsFor(bot)?.has([F.ViewChannel, F.Connect, F.Speak])) throw voiceFailure('permissions')
  const settings = client.settings?.get(guildId) || {}
  if (settings.MUSIC === false) throw voiceFailure('disabled')
  const denied = commandDenial(client, member, request.command, client.music.getState(guildId).currentTrack, { checkDj: true })
  if (denied) throw voiceFailure('control')
  const textId = request.textChannelId || client.music.getState(guildId).textChannelId
  if (textId) {
    const text = await guild.channels.fetch(textId, { force: true })
    if (text?.id !== textId || text.guildId !== guildId || !text.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks])) throw voiceFailure('access')
  }
  if (client._shuttingDown || client._dbReady === false) throw voiceFailure('unavailable')
  return { member, bot, channel }
}

// NyxLink keeps the native queue, filters and voice recovery during moves.
async function relocateVoice(client, guildId, request, { actions, emitState, confirmed }) {
  const state = client.music.getState(guildId), epoch = state.stopRequestEpoch || 0
  const assertCurrent = () => {
    if (client._shuttingDown || state !== client.music.getState(guildId) || state.stopRequested || (state.stopRequestEpoch || 0) !== epoch) throw voiceFailure('changed')
  }
  assertCurrent()
  if (state.nodeTransition) throw voiceFailure('busy')
  state.nodeTransition = true
  try {
    return await actions.run(guildId, async () => {
      assertCurrent()
      const access = await authorizeVoice(client, guildId, request)
      assertCurrent()
      const player = client.music.getPlayer(guildId)
      const source = access.bot.voice?.channelId ?? player?.voiceChannelId ?? null
      if (Object.hasOwn(request, 'expectedVoiceChannelId') && request.expectedVoiceChannelId !== source) throw voiceFailure('changed')
      if (request.expectedSession && (request.expectedSession.id !== state.sessionId || request.expectedSession.playbackId !== state.playbackId || request.expectedSession.stopEpoch !== epoch)) throw voiceFailure('changed')
      if (!client.music.getNode(guildId)) throw voiceFailure('nodes')
      if (!player) {
        const joined = await client.music.joinChannel(guildId, request.voiceChannelId, request.textChannelId)
        assertCurrent()
        await authorizeVoice(client, guildId, request)
        assertCurrent()
        state.nodeTransition = false; confirmed(guildId)
        return joined
      }
      if (source === request.voiceChannelId && player.connected && request.command !== 'reconnect') return player
      // Recheck permissions and actor location after asynchronous authorization.
      const fresh = await authorizeVoice(client, guildId, request)
      assertCurrent()
      if (client.music.getPlayer(guildId) !== player || (fresh.bot.voice?.channelId ?? player.voiceChannelId) !== source) throw voiceFailure('changed')
      if (request.textChannelId) player.setTextChannelId(request.textChannelId)
      // The SDK's connect() is idempotent while already connected. Explicitly
      // disconnect before requesting another channel or a new handshake.
      await player.disconnect()
      assertCurrent()
      await authorizeVoice(client, guildId, request)
      assertCurrent()
      await player.setVoiceState({ channelId: request.voiceChannelId, selfDeaf: true })
      assertCurrent()
      if (!await player.restart({ destroyOnFailure: false, startQueued: false })) throw voiceFailure('unavailable')
      assertCurrent()
      const final = await authorizeVoice(client, guildId, request)
      assertCurrent()
      if (client.music.getPlayer(guildId) !== player || final.bot.voice?.channelId !== request.voiceChannelId) throw voiceFailure('changed')
      state.nodeTransition = false; confirmed(guildId)
      return player
    })
  } catch (error) {
    if (!state.stopRequested && client.music.getState(guildId) === state) {
      state.status = client.music.getPlayer(guildId)?.connected ? state.paused ? 'paused' : state.currentTrack ? 'playing' : 'idle' : 'recovering'
      emitState(guildId, { persist: false })
    }
    throw error
  } finally { state.nodeTransition = false }
}
module.exports = { relocateVoice, authorizeVoice, voiceFailure }
