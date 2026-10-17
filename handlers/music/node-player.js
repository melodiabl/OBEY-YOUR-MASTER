const { AsyncLocalStorage } = require('node:async_hooks')
const { Player, Rest } = require('shoukaku')
const { measureRequest } = require('./request-timing')

const responses = new AsyncLocalStorage()
const number = value => Number.isFinite(value) ? value : undefined

// Shoukaku updates its own fields but discards the REST player response. Keep the
// clock from that same request, scoped to the operation even when controls overlap.
class StateRest extends Rest {
  async updatePlayer(data) {
    const sentAt = Date.now()
    const response = await measureRequest(data.guildId, 'node_update', () => super.updatePlayer(data))
    const context = responses.getStore()
    if (context?.node === this.node && context.guildId === data.guildId && response?.state) {
      context.snapshot = {
        state: {
          position: number(response.state.position), time: number(response.state.time),
          connected: typeof response.state.connected === 'boolean' ? response.state.connected : undefined,
          ping: number(response.state.ping),
        },
        paused: typeof response.paused === 'boolean' ? response.paused : undefined,
        volume: number(response.volume),
        playbackId: typeof response.track?.userData?.obeyPlaybackId === 'string' ? response.track.userData.obeyPlaybackId : undefined,
        trackPresent: Boolean(response.track?.encoded || typeof response.track === 'string' && response.track),
        sentAt, receivedAt: Date.now(),
      }
    }
    return response
  }
}

class StatePlayer extends Player {
  async update(options, noReplace = false) {
    const context = { node: this.node, guildId: this.guildId }
    await responses.run(context, () => super.update(options, noReplace))
    return context.snapshot
  }
}

module.exports = { StatePlayer, StateRest }
