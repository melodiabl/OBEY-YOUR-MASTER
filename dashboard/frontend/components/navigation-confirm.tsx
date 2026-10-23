'use client'
import { useEffect, useRef } from 'react'
export function NavigationConfirm({ cancel, proceed }: { cancel: () => void; proceed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!, previous = document.activeElement
    element.showModal()
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return <dialog className="navigation-confirm" ref={dialog} onCancel={event => { event.preventDefault(); cancel() }} aria-labelledby="discard-title" aria-describedby="discard-description">
    <h2 id="discard-title">¿Descartar los cambios sin guardar?</h2><p id="discard-description">La edición de esta pantalla se perderá. El borrador guardado y la bienvenida publicada se conservan.</p>
    <div className="settings-actions"><button className="primary" autoFocus onClick={cancel}>Seguir editando</button><button className="secondary" onClick={proceed}>Descartar y continuar</button></div>
  </dialog>
}
