// Keep local input visible until the latest volume request has been acknowledged.
(function (root) {
  function createVolumeControl({ send, display, onError, delay = 120 }) {
    let desired = null, confirmed = 100, running = false, timer = null, revision = 0
    function receive(value) {
      if (!Number.isFinite(value)) return
      confirmed = value
      if (desired === null) display(value)
    }
    async function flush() {
      clearTimeout(timer)
      if (running || desired === null) return
      running = true
      const value = desired, version = revision
      try {
        const result = await send(value)
        confirmed = Number.isFinite(result) ? result : value
        if (revision === version) { desired = null; display(confirmed) }
      } catch (error) {
        if (revision === version) { desired = null; display(confirmed); onError(error) }
      } finally {
        running = false
        if (desired !== null) flush()
      }
    }
    function input(value, immediate = false) {
      desired = Number(value); revision++
      display(desired)
      clearTimeout(timer)
      if (immediate) flush()
      else timer = setTimeout(flush, delay)
    }
    return { input, receive }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createVolumeControl
  else root.createVolumeControl = createVolumeControl
})(typeof window !== 'undefined' ? window : globalThis)
