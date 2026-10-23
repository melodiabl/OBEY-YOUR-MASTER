'use client'
import { duration, type Guild } from '../lib/player-state'
import { useElapsed, useMusic } from '../lib/use-music'
const labels = { loading: 'Conectando…', ready: 'Estado actualizado', live: 'En vivo', offline: 'Sin conexión', denied: 'Acceso sin verificar' }
export function Glyph({ name }: { name: string }) {
  return <img className="glyph" src={`/obey-icons/icon_${name}.svg`} alt="" width={20} height={20} />
}
export function MusicPanel({ guild, csrfToken, verify, openLibrary }: { guild: Guild; csrfToken: string; verify: () => void; openLibrary?: () => void }) {
  const { state, connection, error, pending, action, reconnect } = useMusic(guild.id, csrfToken)
  const elapsed = useElapsed(state)
  const available = !!state?.active && ['ready', 'live'].includes(connection) && !pending
  return <section className="music-panel" aria-labelledby="music-title">
    <header className="section-heading"><h2 id="music-title">Música</h2><span className={`connection ${connection}`} role="status"><span />{labels[connection]}</span></header>
    {error && <div className="notice" role="alert"><p>{error}</p><button onClick={connection === 'denied' ? verify : reconnect}>Volver a {connection === 'denied' ? 'verificar' : 'conectar'}</button></div>}
    {connection === 'loading' && !state ? <div className="player-empty" role="status">Cargando el estado del reproductor…</div> :
      !state?.active ? <div className="player-empty"><Glyph name="play" /><h3>{connection === 'offline' || connection === 'denied' ? 'El estado no está disponible' : 'Aquí empieza la próxima canción'}</h3>
        <p>{connection === 'offline' || connection === 'denied' ? 'Recupera la conexión para consultar la música.' : 'Abre el reproductor para buscar música y añadirla a la cola.'}</p><a className="primary" href={`/music/${guild.id}`}>Abrir música</a></div> : <>
        <div className="now-playing">
          {state.current?.artworkUrl ? <img className="artwork" src={state.current.artworkUrl} alt="Portada de la canción actual" width={160} height={160} referrerPolicy="no-referrer" /> : <div className="artwork artwork-placeholder"><Glyph name="play" /></div>}
          <div className="track-details"><p className="muted">{state.paused ? 'En pausa' : 'Sonando en tu servidor'}</p><h3>{state.current?.title}</h3><p>{state.current?.author}</p>
            <div className="timeline"><progress aria-label="Progreso de la canción" value={Math.min(elapsed, state.current?.length || 1)} max={state.current?.length || 1} /><div><span>{duration(elapsed)}</span><span>{duration(state.current?.length || 0)}</span></div></div>
          </div>
        </div>
        <div className="player-controls" aria-label="Controles de música">
          <button className="icon-button" disabled={!available || !state.historyLength} aria-label="Canción anterior" onClick={() => action('previous')}><Glyph name="previous" /></button>
          <button className="play-button" disabled={!available} aria-label={state.paused ? 'Reanudar' : 'Pausar'} onClick={() => action('pause')}><Glyph name={state.paused ? 'play' : 'pause'} /></button>
          <button className="icon-button" disabled={!available} aria-label="Siguiente canción" onClick={() => action('skip')}><Glyph name="skip" /></button>
          <button className="icon-button stop-button" disabled={!available} aria-label="Detener reproducción" onClick={() => action('stop')}><Glyph name="stop" /></button>
          <div className="volume-controls" aria-label="Volumen"><button className="icon-button" disabled={!available || state.volume === 0} aria-label="Bajar volumen" onClick={() => action('volume', Math.max(0, state.volume - 10))}><Glyph name="volume-down" /></button><span aria-label={`Volumen ${state.volume} por ciento`}>{state.volume}%</span><button className="icon-button" disabled={!available || state.volume >= 200} aria-label="Subir volumen" onClick={() => action('volume', Math.min(200, state.volume + 10))}><Glyph name="volume-up" /></button></div>
        </div>
        <p className="action-status" role="status">{pending ? 'Confirmando el cambio…' : '\u00a0'}</p>
        <div className="queue-heading"><h3>A continuación</h3><a href={`/music/${guild.id}`}>Ver toda la cola</a></div>
        {state.queue.length ? <ol className="queue-preview">{state.queue.map((track, i) => <li key={`${i}:${track.title}`}><span className="queue-number">{i + 1}</span><div><strong>{track.title}</strong><span>{track.author}</span></div><span>{duration(track.length)}</span></li>)}</ol> : <p className="muted queue-empty">No hay más canciones en cola.</p>}
      </>}
    <footer className="music-footer"><a href={`/music/${guild.id}`}>Reproductor completo</a><a href={`/app/?server=${guild.id}&view=library`} onClick={event => { if (openLibrary && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openLibrary() } }}>Tu biblioteca y Me gusta</a></footer>
  </section>
}
