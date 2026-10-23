'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLibrary } from '../lib/use-library'
import { filterTracks, type LibraryTrack } from '../lib/library-state'
import { duration, type Guild } from '../lib/player-state'
import { Glyph } from './music-panel'
type Collection = 'liked' | 'playlists' | 'recent' | 'top' | 'playlist'
const labels = { liked: 'Tus Me gusta', playlists: 'Playlists', recent: 'Recientes', top: 'Top del servidor', playlist: 'Playlist' }
export function LibraryPanel({ userId, guild, csrfToken, verify, onEditingChange }: {
  userId: string; guild: Guild; csrfToken: string; verify: () => void; onEditingChange: (dirty: boolean, pending: boolean) => void;
}) {
  const [collection, setCollection] = useState<Collection>('liked'), [playlistId, setPlaylistId] = useState<string | null>(null)
  const [query, setQuery] = useState(''), [page, setPage] = useState(1)
  const library = useLibrary(userId, guild.id, csrfToken, collection === 'playlist' ? playlistId : null)
  const alert = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const search = new URLSearchParams(window.location.search), requested = search.get('collection'), id = search.get('playlist')
    if (requested === 'playlist' && id && /^[a-f0-9]{24}$/i.test(id)) { setCollection('playlist'); setPlaylistId(id) }
    else if (requested === 'liked' || requested === 'playlists' || requested === 'recent' || requested === 'top') setCollection(requested)
  }, [])
  useEffect(() => { onEditingChange(false, library.pending) }, [library.pending, onEditingChange])
  useEffect(() => () => onEditingChange(false, false), [onEditingChange])
  useEffect(() => { if (library.error) alert.current?.focus() }, [library.error])
  const choose = (next: Collection, id: string | null = null) => {
    if (library.pending) return
    setCollection(next); setPlaylistId(id); setQuery(''); setPage(1)
    const params = new URLSearchParams({ server: guild.id, view: 'library', collection: next })
    if (id) params.set('playlist', id)
    window.history.replaceState(null, '', '/app/?' + params.toString())
  }
  const tracks = collection === 'liked' ? library.data?.liked : collection === 'recent' ? library.data?.recent : collection === 'top' ? library.data?.top.tracks : library.detail?.tracks
  const filteredTracks = useMemo(() => filterTracks(tracks || [], query), [tracks, query])
  const playlists = (library.data?.playlists || []).filter(item => item.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es')))
  const total = collection === 'playlists' ? playlists.length : filteredTracks.length
  const pages = Math.max(1, Math.ceil(total / 20)), currentPage = Math.min(page, pages), offset = (currentPage - 1) * 20
  const available = !library.pending && !library.blocked && !library.loading && !library.denied
  const title = collection === 'playlist' ? library.data?.playlists.find(item => item.id === playlistId)?.name || 'Playlist no disponible' : labels[collection]
  return <section className="library-panel" aria-labelledby="library-title" aria-busy={library.loading || library.pending}>
    <header className="settings-heading"><div><h2 id="library-title">Mi biblioteca</h2><p>Tus canciones y playlists son personales. El top muestra la actividad de {guild.name}.</p></div><button className="secondary" disabled={library.loading || library.pending} onClick={library.denied ? verify : library.refresh}>{library.denied ? 'Volver a verificar' : 'Actualizar biblioteca'}</button></header>
    {library.error && <div className="library-notice" role="alert" tabIndex={-1} ref={alert}><p>{library.error}</p><a href={`/music/${guild.id}`}>Abrir reproductor y consultar la cola →</a></div>}
    <p className="library-status" role="status">{library.loading ? 'Cargando tu biblioteca…' : library.status || '\u00a0'}</p>
    {library.data && <>
      <nav className="library-navigation" aria-label="Colecciones de la biblioteca">{(['liked', 'playlists', 'recent', 'top'] as const).map(item => <button key={item} aria-pressed={collection === item || item === 'playlists' && collection === 'playlist'} disabled={library.pending} onClick={() => choose(item)}>{labels[item]}{item === 'liked' && <span>{library.data!.liked.length}</span>}</button>)}</nav>
      <div className="library-collection-heading"><div>{collection === 'playlist' && <button className="text-button" disabled={library.pending} onClick={() => choose('playlists')}>← Tus playlists</button>}<h3>{title}</h3><p>{collection === 'liked' ? 'Colección automática y privada: se actualiza con los corazones de OBEY.' : collection === 'recent' ? 'Tus últimas 100 entradas de reproducción, de todos tus servidores.' : collection === 'top' ? 'Las 10 canciones más reproducidas de este servidor.' : collection === 'playlist' ? 'Playlist personal' : 'Abre una playlist para consultar sus canciones.'}</p></div>
        {collection === 'liked' && <button className="primary" disabled={!available || !library.data.liked.some(track => track.playable)} onClick={library.playLiked}><Glyph name="play" />Reproducir Tus Me gusta</button>}
      </div>
      <div className="library-search"><label htmlFor="library-search">{collection === 'playlists' ? 'Buscar playlist' : 'Buscar canción o artista'}</label><input id="library-search" type="search" maxLength={200} value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} placeholder={collection === 'playlists' ? 'Nombre de la playlist' : 'Título o artista'} /><p role="status">{total} {collection === 'playlists' ? 'playlists' : 'canciones'}{query.trim() ? ' encontradas' : ''}</p></div>
      {collection === 'playlists' ? playlists.length ? <div className="library-playlists">{playlists.slice(offset, offset + 20).map(item => <button className={`library-playlist ${item.automatic ? 'automatic' : ''}`} key={item.id} disabled={library.pending} onClick={() => choose(item.automatic ? 'liked' : 'playlist', item.automatic ? null : item.id)}><Glyph name={item.automatic ? 'like' : 'play'} /><div><h4>{item.name}</h4><p>{item.automatic ? library.data!.liked.length : item.trackCount} canciones · {item.automatic ? 'Automática y privada' : 'Playlist personal'}</p></div><span aria-hidden="true">›</span></button>)}</div> : <p className="library-empty">No hay playlists que coincidan con esta búsqueda.</p> : library.detailLoading && collection === 'playlist' ? <p className="library-empty" role="status">Cargando las canciones de la playlist…</p> : library.detailError && collection === 'playlist' ? <p className="library-empty" role="alert">{library.detailError}</p> : filteredTracks.length ? <ol className="library-tracks" start={offset + 1}>{filteredTracks.slice(offset, offset + 20).map((track, index) => <TrackRow key={`${offset + index}:${track.key}`} track={track} number={offset + index + 1} removable={collection === 'liked'} available={available} play={() => library.play(track)} remove={() => library.unlike(track)} />)}</ol> : <div className="library-empty"><Glyph name={collection === 'liked' ? 'like' : 'play'} /><h4>{query.trim() ? 'No encontré canciones en esta colección' : collection === 'liked' ? 'Aquí aparecerán Tus Me gusta' : 'Todavía no hay canciones en esta colección'}</h4><p>{query.trim() ? 'Prueba otro título o artista.' : collection === 'liked' ? 'Marca canciones con el corazón de OBEY para guardarlas aquí y en Discord.' : 'Las canciones aparecerán cuando haya actividad o contenido guardado.'}</p></div>}
      {pages > 1 && <nav className="library-pagination" aria-label="Páginas de la biblioteca"><button className="secondary" disabled={library.pending || currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage} de {pages}</span><button className="secondary" disabled={library.pending || currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Siguiente</button></nav>}
      {collection === 'top' && <section className="library-listeners" aria-labelledby="library-listeners-title"><h3 id="library-listeners-title">Oyentes más activos</h3>{library.data.top.users.length ? <ol>{library.data.top.users.map((user, index) => <li key={`${index}:${user.suffix}`}><span>Usuario {user.suffix}</span><strong>{user.playCount} reproducciones</strong></li>)}</ol> : <p className="field-help">Aún no hay datos de oyentes en este servidor.</p>}</section>}
    </>}
  </section>
}
function TrackRow({ track, number, removable, available, play, remove }: { track: LibraryTrack; number: number; removable: boolean; available: boolean; play: () => void; remove: () => void }) {
  return <li className="library-track"><span className="library-number" aria-hidden="true">{number}</span><img className="library-artwork" src={track.artworkUrl || '/img/music-placeholder.svg'} alt="" width={48} height={48} loading="lazy" referrerPolicy="no-referrer" onError={event => { if (!event.currentTarget.src.endsWith('/img/music-placeholder.svg')) event.currentTarget.src = '/img/music-placeholder.svg' }} /><div className="library-track-meta"><strong>{track.title}</strong><span>{track.author} · {track.isStream ? 'En directo' : track.length > 0 ? duration(track.length) : 'Duración desconocida'}{track.playCount > 0 ? ` · ${track.playCount} reproducciones` : ''}</span>{!track.playable && <small>Esta entrada no está disponible para reproducir.</small>}</div><div className="library-track-actions"><button className="icon-button" disabled={!available || !track.playable} aria-label={`Reproducir ${track.title}`} onClick={play}><Glyph name="play" /></button>{removable && <button className="icon-button" disabled={!available || !track.key} aria-label={`Quitar ${track.title} de Tus Me gusta`} onClick={remove}><Glyph name="heart-broken" /></button>}</div></li>
}
