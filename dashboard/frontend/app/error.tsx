'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="center-state"><h1>No pude abrir el panel</h1><p>Vuelve a intentarlo para recuperar el estado actual.</p><button onClick={reset} className="primary">Volver a intentar</button><a href="/dashboard">Mis servidores</a></main>
}
