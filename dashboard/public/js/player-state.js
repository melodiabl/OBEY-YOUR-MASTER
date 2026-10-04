(function (root) {
  function createPlayerStateReceiver(render) {
    let session = null, revision = -1, timestamp = -1
    return function receive(state) {
      if (!state || typeof state.active !== 'boolean') return false
      if (state.updatedAt && state.updatedAt < timestamp) return false
      if (state.sessionId && session === state.sessionId && state.revision < revision) return false
      session = state.sessionId || session
      revision = state.revision ?? revision
      timestamp = state.updatedAt || timestamp
      render(state)
      return true
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createPlayerStateReceiver
  else root.createPlayerStateReceiver = createPlayerStateReceiver
})(typeof window !== 'undefined' ? window : globalThis)
