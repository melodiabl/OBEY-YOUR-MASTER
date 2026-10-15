// Personal saved collection, backed by the same favorites used by Discord.
;(function (scope) {
  function createLikedSongs({ api, headers, guildId, current, playTrack, chooseVoice, navigate, toast, artwork, format }) {
    const $ = selector => document.querySelector(selector)
    let songs = [], ready = false, opened = false, sequence = 0, saving = false, playing = false, rowsKey = ''
    const count = () => songs.length + (songs.length === 1 ? ' canción' : ' canciones')
    function icon(name) { const i = document.createElement('i'); i.className = 'fas ' + name; i.setAttribute('aria-hidden', 'true'); return i }
    function heart() {
      const track = current(), liked = Boolean(track?.uri && songs.some(song => song.uri === track.uri))
      $('#pl-play-label').textContent = track ? 'Añadir a la cola' : 'Reproducir'
      for (const selector of ['#bar-like', '#ov-like']) {
        const button = $(selector)
        button.classList.toggle('liked', liked); button.setAttribute('aria-pressed', String(liked))
        button.setAttribute('aria-label', liked ? 'Quitar de Tus Me gusta' : 'Guardar en Tus Me gusta')
        button.title = liked ? 'Quitar de Tus Me gusta' : 'Guardar en Tus Me gusta'
        button.disabled = !track || saving
        button.querySelector('i').className = (liked ? 'fas' : 'far') + ' fa-heart'
      }
    }
    function render() {
      $('#side-liked-count').textContent = ready ? count() : 'Cargando…'
      $('#liked-library-count')?.replaceChildren(document.createTextNode(ready ? count() : 'Cargando…'))
      heart()
      if (!opened) return
      $('#pl-description').textContent = ready ? 'Lista personal · ' + count() : 'Cargando tus canciones…'
      $('#pl-play').disabled = !ready || !songs.length || playing
      const list = $('#g-pldetail'); list.className = 'liked-track-list'
      const key = JSON.stringify([ready, songs])
      if (key === rowsKey) return
      rowsKey = key; list.replaceChildren()
      if (!ready || !songs.length) {
        const empty = document.createElement('div'); empty.className = 'empty'
        empty.textContent = ready ? 'Tu lista está vacía. Marca canciones con el corazón para guardarlas aquí.' : 'Cargando tus canciones…'
        list.append(empty); return
      }
      songs.forEach((song, index) => {
        const row = document.createElement('article'); row.className = 'liked-track'
        const number = document.createElement('span'); number.className = 'liked-track-number'; number.textContent = index + 1
        const button = document.createElement('button'); button.type = 'button'; button.className = 'liked-track-play'
        button.disabled = !song.uri
        button.setAttribute('aria-label', 'Reproducir ' + (song.title || 'canción'))
        const image = document.createElement('img'); image.alt = ''; image.src = artwork(song); image.loading = 'lazy'
        image.onerror = () => { image.onerror = null; image.src = '/img/music-placeholder.svg' }
        const meta = document.createElement('span'); meta.className = 'liked-track-meta'
        const title = document.createElement('b'), author = document.createElement('span')
        title.textContent = song.title || 'Sin título'; author.textContent = song.author || 'Artista desconocido'; meta.append(title, author)
        button.append(image, meta); button.addEventListener('click', () => playTrack(song.uri))
        const duration = document.createElement('span'); duration.className = 'liked-track-duration'; duration.textContent = song.isStream ? 'LIVE' : format(song.length || 0)
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'liked-track-remove'
        remove.setAttribute('aria-label', 'Quitar ' + (song.title || 'canción') + ' de Tus Me gusta'); remove.append(icon('fa-heart'))
        remove.addEventListener('click', () => save(song, false))
        row.append(number, button, duration, remove); list.append(row)
      })
    }
    function receive(rows) {
      const seen = new Set()
      songs = (Array.isArray(rows) ? rows : []).filter(row => {
        const key = row.uri || row.trackId
        if (!key || seen.has(key)) return false
        seen.add(key); return true
      })
      ready = true; render()
    }
    async function reload() {
      const request = ++sequence, response = await api('/api/music/liked')
      if (request !== sequence) return
      if (response.ok && response.j.success !== false) receive(response.j.data)
      else if (!ready) {
        $('#side-liked-count').textContent = 'No se pudo cargar'
        if (opened) $('#g-pldetail').textContent = 'No se pudo cargar Tus Me gusta. Vuelve a abrir la lista para reintentar.'
      }
    }
    async function save(song, liked) {
      if (saving) return
      saving = true; sequence++; heart()
      try {
        const body = { trackId: song.trackId || song.identifier || song.uri, title: song.title, author: song.author,
          uri: song.uri || undefined, artwork: song.artworkUrl || song.artwork, length: song.length, isStream: song.isStream,
          sourceName: song.sourceName && song.sourceName !== 'unknown' ? song.sourceName : '', liked }
        const result = await api('/api/music/like', { method: 'POST', headers, body: JSON.stringify(body) })
        if (!result.ok || result.j.success === false) { toast('No se pudo guardar el cambio. Inténtalo de nuevo.', false); return }
        songs = songs.filter(row => !(song.uri && row.uri === song.uri) && row.trackId !== body.trackId)
        if (liked) songs.unshift({ ...song, trackId: song.uri || body.trackId })
        ready = true; render()
        toast(liked ? 'Añadida a Tus Me gusta' : 'Quitada de Tus Me gusta')
        await reload()
      } finally { saving = false; heart() }
    }
    async function toggle() {
      const track = current()
      if (!track?.uri) return toast('Reproduce una canción para guardarla.', false)
      const existing = songs.find(song => song.uri === track.uri)
      await save(existing || track, !existing)
    }
    function show() {
      navigate('playlist'); opened = true
      $('#pl-header').classList.add('liked-playlist-header')
      $('#pl-title').textContent = 'Tus Me gusta'
      $('#pl-cover').hidden = false; $('#pl-play').hidden = false
      $('#side-liked').setAttribute('aria-current', 'page')
      render(); reload()
    }
    function leave() {
      opened = false; rowsKey = ''; $('#side-liked').removeAttribute('aria-current')
      $('#pl-header').classList.remove('liked-playlist-header')
      $('#pl-cover').hidden = true; $('#pl-play').hidden = true; $('#pl-description').textContent = ''
      $('#g-pldetail').className = 'grid'
    }
    function libraryCard() {
      const button = document.createElement('button'); button.type = 'button'; button.id = 'liked-library'; button.className = 'card'
      const cover = document.createElement('div'); cover.className = 'ph liked-cover'; cover.append(icon('fa-heart'))
      const title = document.createElement('b'); title.textContent = 'Tus Me gusta'
      const text = document.createElement('span'); text.id = 'liked-library-count'; text.textContent = ready ? count() : 'Cargando…'
      button.append(cover, title, text); button.addEventListener('click', show); return button
    }
    async function playAll(voiceChannelId) {
      if (playing || !songs.length) return
      playing = true; render()
      try {
        const result = await api('/api/music/liked/play/' + encodeURIComponent(guildId), { method: 'POST', headers,
          body: JSON.stringify(voiceChannelId ? { voiceChannelId } : {}) })
        if (result.j.error === 'no_voice_channel') chooseVoice(id => playAll(id))
        else if (!result.ok || result.j.success === false) toast(result.j.error === 'empty_collection' ? 'No hay canciones disponibles en Tus Me gusta.' : 'No se pudo reproducir la lista. Revisa la conexión e inténtalo de nuevo.', false)
        else toast(result.j.data.added + ' canciones añadidas a la reproducción')
      } finally { playing = false; render() }
    }
    $('#side-liked').addEventListener('click', show)
    $('#pl-play').addEventListener('click', () => playAll())
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reload() })
    const timer = setInterval(() => { if (!document.hidden && !saving) reload() }, 15000)
    scope.addEventListener('pagehide', () => clearInterval(timer), { once: true })
    return { receive, reload, show, leave, libraryCard, toggle, updateHeart: heart }
  }
  scope.createLikedSongs = createLikedSongs
})(window)
