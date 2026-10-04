(function (root) {
  const placeholder = '/img/music-placeholder.svg'
  function url(track) {
    const info = track?.info || track || {}, plugin = track?.pluginInfo || {}
    for (const candidate of [info.artworkUrl, info.artwork, info.thumbnail, plugin.artworkUrl, plugin.thumbnail]) {
      try { const parsed = new URL(candidate); if (parsed.protocol === 'https:') return parsed.href } catch {}
    }
    try {
      const parsed = new URL(info.uri || info.url), host = parsed.hostname.replace(/^www\./, '')
      const id = host === 'youtu.be' ? parsed.pathname.slice(1) : ['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host) ? (parsed.searchParams.get('v') || parsed.pathname.split('/')[2]) : null
      if (/^[\w-]{11}$/.test(id || '')) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    } catch {}
    if (/youtube|ytdlp/i.test(info.sourceName || '') && /^[\w-]{11}$/.test(info.identifier || '')) return `https://i.ytimg.com/vi/${info.identifier}/hqdefault.jpg`
    return placeholder
  }
  function set(image, track, title = '') {
    const source = url(track)
    image.alt = title
    if (image.dataset.artworkSource === source) return
    image.dataset.artworkSource = source
    image.onerror = () => { image.onerror = null; image.src = placeholder }
    image.src = source
  }
  const api = { url, set, placeholder }
  if (typeof module !== 'undefined' && module.exports) module.exports = api
  else root.trackArtwork = api
})(typeof window !== 'undefined' ? window : globalThis)
