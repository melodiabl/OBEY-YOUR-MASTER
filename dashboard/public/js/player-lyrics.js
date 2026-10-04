(function (root) {
  function createPlayerLyrics({ load, render, now = Date.now }) {
    let opened = false, connected = true, denied = false, follow = true, fullText = false
    let key = '', latest = null, result = null, generation = 0, status = 'idle', page = 0
    let elapsed = 0, syncedAt = now(), paused = true, activeLine = -1
    const identity = state => state?.active && state.current
      ? JSON.stringify([state.sessionId, state.playbackId, state.current.identifier || state.current.uri || state.current.title]) : ''
    function projection() {
      const rows = result?.mode === 'synced' && !fullText ? result.lines.map(line => line.text) : (result?.text || '').split('\n')
      const total = Math.max(1, Math.ceil(rows.length / 20))
      page = Math.max(0, Math.min(total - 1, page))
      return { open: opened, connected, status, mode: result?.mode, text: result ? rows.slice(page * 20, (page + 1) * 20).join('\n') : '',
        rows: result ? rows.slice(page * 20, (page + 1) * 20) : [], page, total, activeLine: fullText ? -1 : activeLine, follow, fullText }
    }
    const draw = () => render(projection())
    function tick() {
      if (!opened || status !== 'ready' || result?.mode !== 'synced' || fullText) return
      const position = elapsed + (!paused && connected ? now() - syncedAt : 0)
      let index = -1
      for (let i = 0; i < result.lines.length && result.lines[i].ms <= position; i++) index = i
      if (index === activeLine) return
      activeLine = index
      if (follow && index >= 0) page = Math.floor(index / 20)
      draw()
    }
    async function lookup() {
      const request = ++generation, requestedKey = key
      result = null; activeLine = -1; page = 0
      if (!key) { status = 'idle'; draw(); return }
      if (denied) { status = 'denied'; draw(); return }
      status = 'loading'; draw()
      try {
        const response = await load()
        if (request !== generation || requestedKey !== key || !opened) return
        if (response.status === 'ready' && (response.sessionId !== latest.sessionId || response.playbackId !== latest.playbackId)) {
          status = 'track_changed'; draw(); return
        }
        status = response.status
        if (status === 'ready') result = response
      } catch (error) {
        if (request !== generation || !opened) return
        status = error.code === 'denied' ? 'denied' : 'unavailable'
      }
      draw(); tick()
    }
    return {
      receive(state) {
        latest = state
        elapsed = Number(state.current?.elapsed) || 0; syncedAt = now(); paused = Boolean(state.paused || !state.active)
        const next = identity(state), changed = next !== key
        key = next
        if (changed && opened) lookup()
        else tick()
      },
      open() { opened = true; follow = true; fullText = false; return lookup() },
      close() { opened = false; generation++; result = null; draw() },
      retry: lookup,
      page(value) { follow = false; page = value; draw() },
      text() { fullText = !fullText; page = 0; activeLine = -1; draw(); tick() },
      follow() { fullText = false; follow = true; activeLine = -1; tick(); draw() },
      connection(value) {
        if (connected === value) return
        if (!value && !paused) elapsed += now() - syncedAt
        syncedAt = now(); connected = value
        if (value) { denied = false; if (opened) lookup() }
        draw()
      },
      deny() { denied = true; generation++; result = null; status = 'denied'; draw() },
      tick,
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createPlayerLyrics
  else root.createPlayerLyrics = createPlayerLyrics
})(typeof window !== 'undefined' ? window : globalThis)
