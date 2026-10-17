const { FILTER_PRESETS } = require('./filters')
const { clampMs } = require('./utils')

function rate(state) {
  const scale = (state.filter === 'custom' ? state.customFilters : FILTER_PRESETS[state.filter])?.timescale
  const positive = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 1
  return positive(scale?.speed) * positive(scale?.rate)
}

function running(state) {
  return Boolean(state?.startedAt && !state.paused && (!state.status || state.status === 'playing'))
}

function position(state, now = Date.now()) {
  const base = Number(state?.lastPosition) || 0
  const elapsed = running(state) ? base + Math.max(0, now - (state.startedAt + base)) * rate(state) : base
  return clampMs(elapsed, Number((state?.currentTrack?.info || state?.currentTrack)?.length || 0))
}

function anchor(state, elapsed, now = Date.now()) {
  state.lastPosition = elapsed
  state.startedAt = state.paused ? null : now - elapsed
}

function nodePosition(state, sample, now = Date.now()) {
  if (!Number.isFinite(sample?.position) || sample.position < 0) return null
  // Public nodes may have a different wall clock; compensate only plausible transit time.
  const age = Number.isFinite(sample.time) && now >= sample.time && now - sample.time <= 2000 ? now - sample.time : 0
  const advance = !state.paused && sample.connected !== false ? age * rate(state) : 0
  return clampMs(sample.position + advance, Number((state.currentTrack?.info || state.currentTrack)?.length || 0))
}

module.exports = { rate, running, position, anchor, nodePosition }
