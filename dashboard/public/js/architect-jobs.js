(function () {
  const app = document.getElementById('architect-app')
  if (!app) return
  const base = `/api/architect/${encodeURIComponent(app.dataset.guildId)}/jobs`
  const button = document.getElementById('architect-analyze'), status = document.getElementById('architect-jobs-status'), list = document.getElementById('architect-jobs')
  let timer, stopped = false, busy = false, idempotencyKey = null, sequence = 0
  const labels = { queued: 'En cola', running: 'Leyendo estructura', completed: 'Completado', failed: 'Falló', cancelled: 'Cancelado' }
  async function request(path = '', body) {
    const response = await fetch(base + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.ok) {
      const denied = [401, 403, 404].includes(response.status)
      const message = denied ? 'Tu sesión o tus permisos ya no permiten consultar estos análisis.' : 'Los trabajos no están disponibles. Puedes seguir editando y revisando la propuesta.'
      if (denied) { stopped = true; list.replaceChildren(); button.disabled = true; status.textContent = message }
      throw new Error(message)
    }
    return data
  }
  function render(jobs) {
    list.replaceChildren()
    for (const job of jobs) {
      const item = document.createElement('div'), title = document.createElement('strong'), detail = document.createElement('p')
      item.className = 'architect-change'; title.textContent = labels[job.status] || 'Estado desconocido'
      detail.textContent = `Pasos completados: ${job.progress.completed} de ${job.progress.total}`
      item.append(title, detail)
      if (job.result) {
        const result = document.createElement('p')
        result.textContent = `${job.result.channelCount} canales/categorías · ${job.result.roleCount} ${job.result.roleCount === 1 ? 'rol' : 'roles'} · Consulta: ${new Date(job.result.capturedAt).toLocaleString()}`
        item.append(result)
      }
      if (job.error) { const error = document.createElement('p'); error.textContent = job.error.message; item.append(error) }
      if (['queued', 'running'].includes(job.status)) {
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'btn btn-sec'
        cancel.textContent = job.cancelRequested ? 'Cancelación solicitada' : 'Cancelar análisis'; cancel.disabled = job.cancelRequested
        cancel.addEventListener('click', async () => {
          cancel.disabled = true
          try { await request(`/${encodeURIComponent(job.id)}/cancel`, {}); await load() }
          catch (error) { status.textContent = error.message; if (!stopped) cancel.disabled = false }
        }); item.append(cancel)
      }
      list.append(item)
    }
  }
  async function load() {
    clearTimeout(timer)
    if (stopped || document.hidden) return
    const current = ++sequence
    let refreshAfter = 15000
    try {
      const data = await request()
      if (stopped || current !== sequence) return
      render(data.jobs); button.disabled = busy || !data.available
      status.textContent = data.available ? (data.jobs.length ? 'Tus análisis guardados · hasta 20 más recientes.' : 'Aún no has solicitado un análisis.') : 'Los trabajos no están disponibles. Puedes seguir editando y revisando la propuesta.'
      refreshAfter = data.jobs.some(job => ['queued', 'running'].includes(job.status)) ? 5000 : 20000
    } catch (error) { if (current === sequence) { status.textContent = error.message; button.disabled = true } }
    finally { if (!stopped && current === sequence) timer = setTimeout(load, refreshAfter) }
  }
  button.addEventListener('click', async () => {
    if (busy) return
    busy = true; button.disabled = true; idempotencyKey ||= crypto.randomUUID()
    let failure
    try { await request('', { idempotencyKey }); idempotencyKey = null }
    catch (error) { failure = error.message }
    finally { busy = false; if (!stopped) await load(); if (failure) status.textContent = failure }
  })
  document.addEventListener('visibilitychange', () => { clearTimeout(timer); if (!document.hidden) load() })
  window.addEventListener('pagehide', () => { stopped = true; sequence++; clearTimeout(timer) })
  window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; load() } })
  load()
})()
