// Audio filter presets for Lavalink 4

const FILTER_PRESETS = {
  bassboost: { equalizer: [
    {band:0,gain:.6},{band:1,gain:.7},{band:2,gain:.5},
    {band:3,gain:.35},{band:4,gain:.2},{band:5,gain:.1},
  ]},
  nightcore: { timescale: { speed:1.3,  pitch:1.3,  rate:1.0 } },
  '8d':      { rotation:  { rotationHz: 0.2 } },
  vaporwave: { timescale: { speed:0.85, pitch:0.85, rate:1.0 } },
  lofi:      { timescale: { speed:0.92, pitch:0.92, rate:1.0 }, lowPass: { smoothing:15.0 } },
  slowed:    { timescale: { speed:0.75, pitch:0.87, rate:1.0 } },
  crystal:   { timescale: { speed:1.0,  pitch:1.18, rate:1.0 } },
  tremolo:   { tremolo:   { frequency:4.0, depth:0.55 } },
  vibrato:   { vibrato:   { frequency:6.0, depth:0.65 } },
  metal:     { equalizer: [
    {band:0,gain:.3},{band:1,gain:.4},{band:2,gain:.5},{band:3,gain:.25},
    {band:4,gain:0},{band:5,gain:-.1},{band:6,gain:.1},{band:7,gain:.2},{band:8,gain:.15},
  ]},
  soft: { lowPass: { smoothing: 25.0 } },
  pop:  { equalizer: [
    {band:2,gain:.15},{band:3,gain:.2},{band:4,gain:.3},
    {band:5,gain:.25},{band:6,gain:.2},{band:7,gain:.1},
  ]},
  karaoke: { karaoke: { level:1.0, monoLevel:1.0, filterBand:220.0, filterWidth:100.0 } },
  treblebass: { equalizer: [
    {band:0,gain:.6},{band:1,gain:.5},{band:2,gain:.3},{band:3,gain:.1},
    {band:10,gain:.3},{band:11,gain:.4},{band:12,gain:.5},{band:13,gain:.4},
  ]},
  // Presets del plugin LavaDSPX (pluginFilters)
  normalizar: { pluginFilters: { normalization: { maxAmplitude: 0.75, adaptive: true } } },
  eco:        { pluginFilters: { echo: { echoLength: 0.35, decay: 0.3 } } },
  radio:      { pluginFilters: { 'high-pass': { cutoffFrequency: 800, boostFactor: 1.2 } } },
  off: null,
}

const FILTER_RESET = {
  equalizer: [], timescale: null, tremolo: null, vibrato: null,
  rotation: null, distortion: null, channelMix: null, lowPass: null, karaoke: null,
  pluginFilters: {},
}

const FILTER_NAMES = Object.keys(FILTER_PRESETS).filter(k => k !== 'off')

// Returns a human-readable label for use in embeds
function filterLabel(preset) {
  const labels = {
    bassboost:'Bass Boost', nightcore:'Nightcore', '8d':'8D Audio', vaporwave:'Vaporwave',
    lofi:'Lo-Fi', slowed:'Slowed+Reverb', crystal:'Crystal', metal:'Metal',
    pop:'Pop', soft:'Soft', tremolo:'Tremolo', vibrato:'Vibrato', karaoke:'Karaoke', treblebass:'Treble + Bass',
    normalizar:'Normalizar volumen', eco:'Eco', radio:'Radio FM',
  }
  return labels[preset] || null
}

module.exports = { FILTER_PRESETS, FILTER_RESET, FILTER_NAMES, filterLabel }
