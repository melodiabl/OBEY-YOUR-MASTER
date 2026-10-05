(function () {
  const app = document.getElementById('architect-app')
  if (!app) return
  const api = `/api/architect/${encodeURIComponent(app.dataset.guildId)}`, base = `${api}/jobs`
  const button = document.getElementById('architect-analyze'), status = document.getElementById('architect-jobs-status'), list = document.getElementById('architect-jobs')
  const backup = document.getElementById('architect-backup'), points = document.getElementById('architect-restore-points')
  let timer, stopped = false, busy = false, sequence = 0
  const keys = {}
  const labels = { queued: 'En cola', running: 'En curso', completed: 'Completado', failed: 'Falló', cancelled: 'Cancelado' }
  async function request(path = '', body, endpoint = base) {
    const response = await fetch(endpoint + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.ok) {
      const denied = [401, 403, 404].includes(response.status)
      const message = denied ? 'Tu sesión o tus permisos ya no permiten consultar estos trabajos.' : 'Los trabajos no están disponibles. Puedes seguir editando y revisando la propuesta.'
      if (denied) { stopped = true; list.replaceChildren(); points.replaceChildren(); button.disabled = true; backup.disabled = true; status.textContent = message }
      throw new Error(message)
    }
    return data
  }
  function render(jobs) {
    list.replaceChildren()
    for (const job of jobs) {
      const item = document.createElement('div'), title = document.createElement('strong'), detail = document.createElement('p')
      item.className = 'architect-change'; title.textContent = `${job.type === 'architect.apply' ? 'Aplicación' : job.type === 'architect.backup' ? 'Punto de restauración' : 'Análisis'} · ${labels[job.status] || 'Estado desconocido'}`
      detail.textContent = `Pasos completados: ${job.progress.completed} de ${job.progress.total}`
      item.append(title, detail)
      if (job.result) {
        const result = document.createElement('p')
        result.textContent = `${job.result.channelCount} canales/categorías · ${job.result.roleCount} ${job.result.roleCount === 1 ? 'rol' : 'roles'} · Consulta: ${new Date(job.result.capturedAt).toLocaleString()}`
        item.append(result)
      }
      if (job.error && job.status !== 'cancelled') { const error = document.createElement('p'); error.textContent = job.error.message; item.append(error) }
      if (job.type === 'architect.apply') {
        const warning = document.createElement('p')
        warning.textContent = job.result ? `${job.result.edits} ${job.result.edits === 1 ? 'recurso editado' : 'recursos editados'}. Actualiza la estructura para diseñar otra propuesta.` : 'La cancelación no revierte cambios ya realizados. Una edición incierta requiere revisar la copia antes de otra aplicación.'
        item.append(warning)
      }
      if (['queued', 'running'].includes(job.status)) {
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn-sec'
        cancel.textContent = job.cancelRequested ? 'Cancelación solicitada' : job.type === 'architect.apply' ? 'Detener aplicación' : job.type === 'architect.backup' ? 'Cancelar copia' : 'Cancelar análisis'; cancel.disabled = job.cancelRequested
        cancel.addEventListener('click', async () => {
          cancel.disabled = true
          try { await request(`/${encodeURIComponent(job.id)}/cancel`, {}); await load() }
          catch (error) { status.textContent = error.message; if (!stopped) cancel.disabled = false }
        }); item.append(cancel)
      }
      list.append(item)
    }
  }
  function renderPoints(records) {
    points.replaceChildren()
    if (!records.length) { points.textContent = 'Aún no tienes puntos de restauración guardados.'; return }
    for (const point of records) {
      const item = document.createElement('div'), title = document.createElement('strong'), description = document.createElement('p'), inspect = document.createElement('button')
      item.className = 'architect-change'; title.textContent = new Date(point.createdAt).toLocaleString()
      description.textContent = `${point.channelCount} canales/categorías · ${point.roleCount} roles · Solo estructura`
      inspect.type = 'button'; inspect.className = 'btn btn-sec'; inspect.textContent = 'Inspeccionar copia'
      inspect.addEventListener('click', async () => {
        inspect.disabled = true
        try {
          const data = await request(`/${encodeURIComponent(point.id)}`, undefined, `${api}/restore-points`)
          if (stopped || !item.isConnected) return
          const detail = document.createElement('p')
          detail.textContent = `${data.point.warnings.join(' ')} Canales: ${data.point.snapshot.channels.map(channel => channel.name).join(', ') || 'ninguno'}. Roles: ${data.point.snapshot.roles.map(role => role.name).join(', ') || 'ninguno'}.`
          item.append(detail); inspect.remove()
        } catch (error) { status.textContent = error.message; if (!stopped) inspect.disabled = false }
      })
      item.append(title, description, inspect); points.append(item)
    }
  }
  async function load() {
    clearTimeout(timer)
    if (stopped || document.hidden) return
    const current = ++sequence
    let refreshAfter = 15000
    try {
      const [data, stored] = await Promise.all([request(), request('', undefined, `${api}/restore-points`)])
      if (stopped || current !== sequence) return
      render(data.jobs); renderPoints(stored.points); button.disabled = backup.disabled = busy || !data.available
      status.textContent = data.available ? (data.jobs.length ? 'Tus trabajos guardados · hasta 20 más recientes.' : 'Aún no has solicitado un trabajo.') : 'Los trabajos no están disponibles. Puedes seguir editando y revisando la propuesta.'
      refreshAfter = data.jobs.some(job => ['queued', 'running'].includes(job.status)) ? 5000 : 20000
    } catch (error) { if (current === sequence) { status.textContent = error.message; button.disabled = backup.disabled = true } }
    finally { if (!stopped && current === sequence) timer = setTimeout(load, refreshAfter) }
  }
  async function submit(kind, endpoint) {
    if (busy) return
    busy = true; button.disabled = backup.disabled = true; keys[kind] ||= crypto.randomUUID()
    let failure
    try { await request('', { idempotencyKey: keys[kind] }, endpoint); delete keys[kind] }
    catch (error) { failure = error.message }
    finally { busy = false; if (!stopped) await load(); if (failure) status.textContent = failure }
  }
  button.addEventListener('click', () => submit('snapshot', base))
  backup.addEventListener('click', () => submit('backup', `${api}/restore-points`))
  document.addEventListener('visibilitychange', () => { clearTimeout(timer); if (!document.hidden) load() })
  document.addEventListener('obey:jobs-changed', load)
  window.addEventListener('pagehide', () => { stopped = true; sequence++; clearTimeout(timer) })
  window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; load() } })
  load()
})()
