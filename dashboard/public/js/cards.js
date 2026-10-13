(() => {
  const root = document.getElementById('cards-editor'); if (!root) return
  const $ = key => document.getElementById('cards-' + key), base = '/api/cards/' + encodeURIComponent(root.dataset.guildId)
  let state, busy = false, blocked = false, deleting = null, previewURL
  const status = (message, error = false) => { $('status').textContent = message; $('status').dataset.error = String(error) }
  const selected = () => $('background').value === 'neutral' ? null : $('background').value
  function update() {
    $('upload-fields').disabled = busy || blocked || !state || state.assets.length >= state.limit
    $('preview-fields').disabled = busy || blocked || !state
    $('refresh').disabled = busy
    root.querySelectorAll('.cards-asset button').forEach(button => { button.disabled = busy || blocked || button.dataset.used === 'true' })
    $('delete-yes').disabled = busy || blocked
    if (state) {
      const id = state.selections[$('slot').value], name = id === 'legacy' ? 'Fondo anterior del bot' : id === null ? 'Fondo predeterminado' : state.assets.find(asset => asset.id === id)?.name || 'Fondo no disponible'
      $('active').textContent = 'Fondo activo: ' + name
      $('apply').disabled = busy || blocked || selected() === id
    }
  }
  function clearPreview() { if (previewURL) URL.revokeObjectURL(previewURL); previewURL = null; $('preview-image').removeAttribute('src'); $('preview-image').hidden = true; $('preview-text').textContent = ''; $('preview-placeholder').hidden = false }
  function errorMessage(error) {
    const denied = error.status === 401 || error.status === 403 || error.message === 'guild_not_found'
    if (denied) { blocked = true; state = null; clearPreview(); $('gallery').replaceChildren(); $('background').replaceChildren(); $('active').textContent = ''; $('quota').textContent = ''; $('delete-confirm').hidden = true }
    return ({ asset_permissions: 'Ya no tienes acceso para administrar este servidor.', not_authenticated: 'Tu sesión terminó. Vuelve a iniciar sesión.', csrf_invalid: 'Actualiza la página para renovar la sesión.',
      asset_conflict: 'Los fondos cambiaron. Actualiza para revisar el estado antes de guardar.', asset_in_use: 'Este fondo está en uso. Elige otro antes de eliminarlo.',
      asset_limit: 'Ya tienes 3 fondos. Elimina uno que no esté en uso para subir otro.', asset_too_large: 'La imagen supera 4 MiB.',
      invalid_card_image: 'No se pudo validar la imagen. Usa un PNG, JPG o WebP estático.', asset_not_found: 'Este fondo ya no está disponible.',
      asset_busy: 'El servicio de imágenes está ocupado. Inténtalo de nuevo en unos segundos.' })[error.message] || (denied ? 'No se pudo confirmar tu acceso.' : 'No se pudo confirmar el resultado. Actualiza antes de repetir la operación.')
  }
  async function request(path = '', options = {}) {
    const response = await fetch(base + path, { credentials: 'same-origin', ...options, headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || '', ...(options.headers || {}) } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw Object.assign(Error(body.error || 'request_failed'), { status: response.status })
    return body
  }
  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  function display(body, selection) {
    state = body; blocked = false; deleting = null; $('delete-confirm').hidden = true
    $('quota').textContent = `${body.assets.length} / ${body.limit}`
    $('background').replaceChildren(new Option('Fondo anterior del bot', 'legacy'), new Option('Fondo predeterminado', 'neutral'), ...body.assets.map(asset => new Option(asset.name, asset.id)))
    const active = body.selections[$('slot').value]
    $('background').value = selection !== undefined ? selection === null ? 'neutral' : selection : active === null ? 'neutral' : active
    $('gallery').replaceChildren()
    for (const asset of body.assets) {
      const row = document.createElement('article'); row.className = 'cards-asset'
      const image = document.createElement('img'); image.src = base + '/assets/' + encodeURIComponent(asset.id); image.alt = 'Fondo: ' + asset.name
      const copy = document.createElement('div'), title = document.createElement('strong'), detail = document.createElement('p')
      title.textContent = asset.name; const used = Object.values(body.selections).includes(asset.id)
      detail.textContent = `${asset.width} × ${asset.height} · ${Math.ceil(asset.bytes / 1024)} KiB · ${used ? 'En uso' : 'Disponible durante 7 días'}`
      copy.append(title, detail)
      const actions = document.createElement('div'); actions.className = 'cards-actions'
      const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'btn btn-sec btn-sm'; preview.textContent = 'Probar fondo'; preview.addEventListener('click', () => { $('background').value = asset.id; previewCard() })
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-sec btn-sm'; remove.textContent = 'Eliminar'; remove.dataset.used = String(used)
      remove.addEventListener('click', () => { deleting = asset.id; $('delete-confirm').hidden = false; $('delete-yes').focus() })
      actions.append(preview, remove); row.append(image, copy, actions); $('gallery').append(row)
    }
    $('empty').hidden = body.assets.length !== 0; update()
  }
  async function operation(message, work) {
    if (busy || blocked) return
    busy = true; update(); status(message)
    try { await work() } catch (error) { status(errorMessage(error), true) }
    finally { busy = false; update() }
  }
  async function refresh() {
    if (busy) return
    blocked = false
    await operation('Leyendo fondos del servidor…', async () => { display(await request()); clearPreview(); status('Fondos actualizados. Puedes probar una tarjeta sin enviar mensajes.') })
  }
  async function previewCard() {
    if (!state) return
    await operation('Generando la tarjeta…', async () => {
      clearPreview()
      const body = await request('/preview', json('POST', { slot: $('slot').value, assetId: selected(), name: $('name').value }))
      $('preview-text').textContent = body.text
      if (body.image) {
        const bytes = Uint8Array.from(atob(body.image), character => character.charCodeAt(0))
        previewURL = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
        $('preview-image').src = previewURL; $('preview-image').hidden = false; $('preview-placeholder').hidden = true
      }
      status(body.warning ? 'La imagen no está disponible ahora. El mensaje de texto se conserva.' : 'Vista previa lista. Para activarla, pulsa «Usar este fondo».', Boolean(body.warning))
    })
  }
  $('preview-form').addEventListener('submit', event => { event.preventDefault(); previewCard() })
  $('upload').addEventListener('submit', event => {
    event.preventDefault(); const file = $('file').files[0]
    if (!file || !state) return
    if (file.size > 4 * 1024 * 1024) { status('La imagen supera 4 MiB.', true); return }
    operation('Validando y guardando el fondo…', async () => {
      const selection = selected(), body = await request('/assets?' + new URLSearchParams({ name: file.name.slice(0, 100), revision: state.revision }), { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file })
      display(body, selection); $('file').value = ''; status('Fondo guardado. Puedes probarlo antes de usarlo.')
    })
  })
  $('apply').addEventListener('click', () => { if (!state) return; operation('Activando el fondo…', async () => { display(await request('/selection', json('PUT', { slot: $('slot').value, assetId: selected(), revision: state.revision }))); status('Fondo activo. El bot lo usará en esta tarjeta y destino.') }) })
  $('delete-yes').addEventListener('click', () => { if (!deleting || !state) return; operation('Eliminando el fondo…', async () => { display(await request('/assets/' + encodeURIComponent(deleting), json('DELETE', { revision: state.revision }))); clearPreview(); status('Fondo eliminado.') }) })
  $('delete-no').addEventListener('click', () => { deleting = null; $('delete-confirm').hidden = true })
  $('slot').addEventListener('change', () => { if (state) display(state); clearPreview(); update() })
  $('background').addEventListener('change', () => { clearPreview(); update() })
  $('refresh').addEventListener('click', refresh)
  window.addEventListener('pagehide', clearPreview)
  refresh()
})()
