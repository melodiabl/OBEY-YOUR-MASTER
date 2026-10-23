import type { Guild } from '../lib/player-state'
import { Glyph } from './music-panel'
export function SettingsPanel({ guild, openWelcome }: { guild: Guild; openWelcome: () => void }) {
  return <section className="settings-overview" aria-labelledby="settings-title"><header className="settings-heading"><div><h2 id="settings-title">Configuración del servidor</h2><p>Elige qué quieres configurar en {guild.name}.</p></div></header>
    <div className="settings-options"><button className="settings-option" onClick={openWelcome}><Glyph name="profile" /><div><h3>Bienvenida</h3><p>Elige el canal, escribe el mensaje y revisa cómo lo recibirán los nuevos miembros.</p><span>Configurar bienvenida →</span></div></button>
      <a className="settings-option" href={`/dashboard/${guild.id}?tab=logs`}><Glyph name="transcript" /><div><h3>Registros</h3><p>Configura los canales y las categorías de eventos que quieres registrar.</p><span>Configurar registros →</span></div></a>
      <a className="settings-option" href={`/dashboard/${guild.id}`}><Glyph name="settings" /><div><h3>Ajustes generales</h3><p>Consulta las preferencias y los demás sistemas del servidor.</p><span>Ver ajustes →</span></div></a>
    </div>
  </section>
}
