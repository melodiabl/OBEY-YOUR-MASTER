'use client'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, request } from '../lib/api'
import { imageURL, type Guild, type PanelContext } from '../lib/player-state'
import { Glyph, MusicPanel } from './music-panel'
import { WelcomeEditor } from './welcome-editor'
import { SettingsPanel } from './settings-panel'
import { NavigationConfirm } from './navigation-confirm'
import { LibraryPanel } from './library-panel'
type PanelView = 'overview' | 'configuration' | 'welcome' | 'library'
export function Dashboard() {
  const [context, setContext] = useState<PanelContext | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [failure, setFailure] = useState<'session' | 'network' | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [view, setView] = useState<PanelView>('overview')
  const [editorState, setEditorState] = useState({ dirty: false, pending: false })
  const [intent, setIntent] = useState<{ id: string; view: PanelView } | null>(null)
  const editingChanged = useCallback((dirty: boolean, pending: boolean) => setEditorState(current => current.dirty === dirty && current.pending === pending ? current : { dirty, pending }), [])
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), 12000)
    setFailure(null); setContext(null)
    request<PanelContext>('/api/panel/context', { signal: controller.signal }).then(data => {
      if (controller.signal.aborted) return
      if (!Array.isArray(data.guilds) || !data.user?.id || typeof data.csrfToken !== 'string') throw new Error('invalid_context')
      const query = new URLSearchParams(window.location.search)
      const requested = query.get('server'), page = query.get('view')
      setView(page === 'welcome' || page === 'configuration' || page === 'library' ? page : 'overview')
      setContext(data)
      setSelected(requested && data.guilds.some(g => g.id === requested) ? requested : requested ? null : data.guilds[0]?.id || null)
      setUnavailable(!!requested && !data.guilds.some(g => g.id === requested))
    }).catch(reason => {
      if (controller.signal.aborted && controller.signal.reason !== 'timeout') return
      setFailure(reason instanceof ApiError && reason.status === 401 ? 'session' : 'network')
    }).finally(() => clearTimeout(timeout))
    return () => { clearTimeout(timeout); controller.abort() }
  }, [attempt])
  const verify = useCallback(() => setAttempt(value => value + 1), [])
  const navigate = (id: string, page: PanelView) => {
    setSelected(id); setView(page); setUnavailable(false); setEditorState({ dirty: false, pending: false }); setIntent(null)
    const query = new URLSearchParams({ server: id })
    if (page !== 'overview') query.set('view', page)
    window.history.replaceState(null, '', '/app/?' + query.toString())
  }
  const choose = (id: string, page = view) => {
    if (!context?.guilds.some(guild => guild.id === id) || editorState.pending || id === selected && page === view) return
    if (editorState.dirty) setIntent({ id, view: page })
    else navigate(id, page)
  }
  if (failure) return <main className="center-state"><div className="brand-mark">O</div><h1>{failure === 'session' ? 'Vuelve a entrar a OBEY' : 'No pude verificar tus servidores'}</h1>
    <p>{failure === 'session' ? 'Tu sesión de Discord terminó. Conecta tu cuenta para continuar.' : 'La conexión no está disponible. Tus ajustes siguen guardados.'}</p>
    {failure === 'session' ? <a className="primary" href="/login?returnTo=%2Fapp">Entrar con Discord</a> : <button className="primary" onClick={verify}>Volver a intentar</button>}<a href="/dashboard">Mis servidores</a></main>
  if (!context) return <main className="center-state" aria-busy="true"><div className="brand-mark">O</div><h1>Abriendo tu espacio</h1><p role="status">Verificando tu sesión y tus servidores…</p></main>
  const guild = context.guilds.find(item => item.id === selected)
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Ir al contenido</a>
    <aside className="sidebar" aria-label="Tus servidores">
      <a href="/app/" className="brand"><span className="brand-mark">O</span><span><strong>OBEY</strong><small>Your Master</small></span></a>
      <div className="sidebar-heading"><h2>Tus servidores</h2><span>{context.guilds.length}</span></div>
      <nav className="server-list" aria-label="Elegir servidor">{context.guilds.map(item => <button key={item.id} className={selected === item.id ? 'selected' : ''} aria-pressed={selected === item.id} disabled={editorState.pending} onClick={() => choose(item.id)}><ServerAvatar guild={item} /><span>{item.name}</span></button>)}</nav>
      <div className="sidebar-bottom"><a href="/dashboard"><Glyph name="roles" />Gestionar servidores</a><div className="account">
        {imageURL(context.user.avatarUrl) ? <img src={context.user.avatarUrl!} alt="" width={36} height={36} /> : <span className="account-avatar">{context.user.name.slice(0, 1)}</span>}<div><strong>{context.user.name}</strong><span>Tu cuenta de Discord</span></div>
      </div><form action="/logout" method="post"><input type="hidden" name="_csrf" value={context.csrfToken} /><button type="submit">Cerrar sesión</button></form></div>
    </aside>
    <main id="main-content" className="workspace" tabIndex={-1}>
      <div className="workspace-bar"><span>Panel de comunidad</span><a href="/dashboard">Mis servidores</a></div>
      <div className="mobile-server"><label htmlFor="server-select">Servidor</label><select id="server-select" disabled={editorState.pending} value={selected || ''} onChange={event => choose(event.target.value)}><option value="" disabled>Elige un servidor</option>{context.guilds.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div>
      {!context.guilds.length ? <section className="empty-workspace"><h1>Tu comunidad empieza aquí</h1><p>No hay servidores con OBEY que puedas administrar con esta cuenta.</p><a className="primary" href="/dashboard">Ver mis servidores</a></section> : !guild ? <section className="empty-workspace"><h1>{unavailable ? 'Este servidor no está disponible' : 'Elige tu servidor'}</h1><p>Selecciona uno de tus servidores para consultar su música y configuración.</p></section> : <>
        <header className="workspace-heading"><ServerAvatar guild={guild} /><div><h1>{guild.name}</h1><p><span>{guild.memberCount === null ? 'Tu espacio de comunidad' : `${new Intl.NumberFormat('es').format(guild.memberCount)} miembros`}</span><span className="dot-separator" aria-hidden="true">·</span><span>Administración de OBEY</span></p></div></header>
        <nav className="page-navigation" aria-label="Secciones del panel">{([{ id: 'overview', label: 'Resumen' }, { id: 'configuration', label: 'Configuración' }, { id: 'welcome', label: 'Bienvenida' }, { id: 'library', label: 'Biblioteca' }] as const).map(page => <button key={page.id} aria-current={view === page.id ? 'page' : undefined} disabled={editorState.pending} onClick={() => choose(guild.id, page.id)}>{page.label}</button>)}</nav>
        {view === 'overview' ? <div className="workspace-grid"><MusicPanel key={guild.id} guild={guild} csrfToken={context.csrfToken} verify={verify} openLibrary={() => choose(guild.id, 'library')} /><Tools guild={guild} open={page => choose(guild.id, page)} /></div> : view === 'configuration' ? <SettingsPanel guild={guild} openWelcome={() => choose(guild.id, 'welcome')} /> : view === 'library' ? <LibraryPanel key={guild.id} userId={context.user.id} guild={guild} csrfToken={context.csrfToken} verify={verify} onEditingChange={editingChanged} /> : <WelcomeEditor key={guild.id} guildId={guild.id} csrfToken={context.csrfToken} verify={verify} onEditingChange={editingChanged} />}

      </>}
      <footer className="workspace-footer"><span>OBEY Your Master</span><a href={guild ? `/help/${guild.id}` : '/dashboard'}>Ayuda y comandos</a></footer>
    </main>
    {intent && <NavigationConfirm cancel={() => setIntent(null)} proceed={() => navigate(intent.id, intent.view)} />}
  </div>
}
function ServerAvatar({ guild }: { guild: Guild }) {
  return imageURL(guild.iconUrl) ? <img className="server-avatar" src={guild.iconUrl!} alt="" width={44} height={44} referrerPolicy="no-referrer" /> : <span className="server-avatar" aria-hidden="true">{guild.name.slice(0, 1).toUpperCase()}</span>
}
function Tools({ guild, open }: { guild: Guild; open: (page: PanelView) => void }) {
  const links = [
    { name: 'Configuración', text: 'Canales, permisos y preferencias.', icon: 'settings', url: `/app/?server=${guild.id}&view=configuration`, view: 'configuration' as const },
    { name: 'Bienvenida', text: 'Mensaje, canal y vista previa.', icon: 'profile', url: `/app/?server=${guild.id}&view=welcome`, view: 'welcome' as const },
    { name: 'Registros', text: 'Destinos y categorías de eventos.', icon: 'transcript', url: `/dashboard/${guild.id}?tab=logs` },
    { name: 'Biblioteca', text: 'Tus listas y canciones favoritas.', icon: 'play', url: `/app/?server=${guild.id}&view=library`, view: 'library' as const },
  ]
  return <aside className="tools" aria-labelledby="tools-title"><h2 id="tools-title">Configuración del servidor</h2><p>Accede a los ajustes y contenidos del servidor.</p><div className="tool-list">{links.map(link => <a href={link.url} key={link.name} onClick={event => { if ('view' in link && link.view && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); open(link.view) } }}><Glyph name={link.icon} /><div><strong>{link.name}</strong><span>{link.text}</span></div><span aria-hidden="true">›</span></a>)}</div><div className="server-note"><h3>Un mismo servidor</h3><p>Los cambios que hagas aquí también se aplican al bot en Discord.</p></div></aside>
}
