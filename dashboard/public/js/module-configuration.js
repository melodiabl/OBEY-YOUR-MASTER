(function () {
  const app = document.getElementById('module-configuration')
  if (!app) return
  const $ = name => document.getElementById(`config-${name}`)
  const base = `/api/guilds/${encodeURIComponent(app.dataset.guildId)}/modules/${encodeURIComponent(app.dataset.moduleId)}`
  let source, channels = [], busy = false, blocked = false, pendingPublication
  const values = () => ({ channelId: $('channel').value || null, message: $('message').value })
  const equal = (a, b) => a?.channelId === b?.channelId && a?.message === b?.message
  const editing = () => source?.draft?.config || source?.published.config
  const dirty = () => Boolean(source && !equal(values(), editing()))
  const channelName = id => id ? `#${channels.find(channel => channel.id === id)?.name || 'Canal eliminado o inaccesible'}` : 'Envío a canal desactivado'
  function status(text, error = false) { $('status').textContent = text; $('status').dataset.state = error ? 'error' : 'ready' }
  function update() {
    $('fields').disabled = busy || !source
    $('refresh').disabled = busy
    $('save').disabled = blocked || busy || !source
    $('publish').disabled = blocked || busy || !source?.draft || dirty() || source.draft.baseRevision !== source.published.revision
    $('preview').disabled = busy || !source
    app.setAttribute('aria-busy', String(busy))
    $('review-empty').hidden = !source || !equal(values(), source.published.config)
    $('diff').replaceChildren()
    if (source) for (const [key, label] of [['channelId', 'Canal'], ['message', 'Mensaje']]) {
      const before = source.published.config[key], after = values()[key]
      if (before === after) continue
      const title = document.createElement('dt'), content = document.createElement('dd')
      title.textContent = label
      content.textContent = `Publicado: ${key === 'channelId' ? channelName(before) : before || '(vacío)'}\nBorrador: ${key === 'channelId' ? channelName(after) : after || '(vacío)'}`
      $('diff').append(title, content)
    }
    $('draft-detail').textContent = !source ? '' : dirty() ? 'Hay cambios locales sin guardar.' : source.draft ? `Borrador ${source.draft.revision} guardado. Todavía no está publicado.` : 'Puedes preparar un nuevo borrador.'
  }
  function display(body, preserve = false) {
    source = body
    $('published-channel').textContent = channelName(body.published.config.channelId)
    $('published-message').textContent = body.published.config.message || '(Mensaje vacío)'
    $('published-date').textContent = body.published.updatedAt ? `Última publicación: ${new Date(body.published.updatedAt).toLocaleString('es')}` : 'Configuración existente del servidor.'
    if (!preserve) {
      const config = editing()
      if (config.channelId && ![...$('channel').options].some(option => option.value === config.channelId)) $('channel').add(new Option('Canal eliminado o inaccesible', config.channelId))
      $('channel').value = config.channelId || ''
      $('message').value = config.message
    }
    $('other-draft').hidden = !preserve || !body.draft || equal(values(), body.draft.config)
    $('other-draft').textContent = body.draft ? `Borrador guardado actualmente: ${channelName(body.draft.config.channelId)} · ${body.draft.config.message}` : ''
    update()
  }
  function clear() {
    source = null; pendingPublication = null
    $('channel').replaceChildren(); $('message').value = ''; $('diff').replaceChildren()
    $('published-message').textContent = ''; $('published-channel').textContent = ''
    $('other-draft').hidden = true; $('other-draft').textContent = ''; $('conflict').hidden = true
    $('published-date').textContent = ''; $('draft-detail').textContent = ''
    $('preview-panel').hidden = true; $('preview-content').textContent = ''
    update()
  }
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) })
    const value = await response.json()
    if (!response.ok) throw Object.assign(new Error(value.error), { status: response.status, current: value.current })
    return value
  }
  function errorMessage(error) {
    if ([401, 403, 404].includes(error.status) && error.message !== 'configuration_permissions') {
      clear(); return 'Tu acceso a esta configuración ya no está disponible.'
    }
    if (error.status === 409) {
      if (error.current) display(error.current, true)
      blocked = true; $('conflict').hidden = false
      $('conflict').textContent = 'La configuración cambió. Actualiza y compara antes de guardar; tus cambios locales se conservan.'
      return 'Conflicto de revisión. No se publicaron tus cambios.'
    }
    if (error.status === 400) return 'Revisa el canal y el mensaje. El mensaje admite hasta 500 caracteres.'
    if (error.message === 'configuration_permissions') return 'Faltan permisos del administrador o del bot en ese canal.'
    blocked = true
    return 'No se pudo confirmar el resultado. Actualiza para comprobarlo antes de repetir.'
  }
  async function refresh() {
    if (busy) return
    const preserve = dirty(), local = values()
    busy = true; update(); status('Leyendo la configuración actual…')
    try {
      const [body, destinations] = await Promise.all([request('/config'), request('/channels')])
      channels = destinations.channels
      $('channel').replaceChildren(new Option('Desactivar envío a canal', ''), ...channels.map(channel => new Option(`#${channel.name}`, channel.id)))
      if (preserve) {
        if (local.channelId && !channels.some(channel => channel.id === local.channelId)) $('channel').add(new Option('Canal eliminado o inaccesible', local.channelId))
        $('channel').value = local.channelId || ''; $('message').value = local.message
      }
      blocked = false; $('conflict').hidden = true
      display(body, preserve)
      const reconciled = pendingPublication && body.lastPublication?.operationId === pendingPublication.operationId
      if (reconciled) pendingPublication = null
      status(reconciled ? 'Publicación confirmada. El bot utiliza esta configuración.' : preserve ? 'Configuración actualizada. Revisa tus cambios frente a lo publicado y al borrador guardado.' : body.draft ? 'Borrador recuperado. Revisa los cambios antes de publicarlo.' : 'Configuración publicada cargada.')
    } catch (error) { status(errorMessage(error), true) }
    finally { busy = false; update() }
  }
  $('form').addEventListener('submit', async event => {
    event.preventDefault()
    if (busy || blocked || !source) return
    busy = true; update(); status('Guardando borrador…')
    try {
      const body = await request('/draft', 'PUT', { config: values(), expectedDraftRevision: source.draftRevision, expectedPublishedRevision: source.published.revision })
      pendingPublication = null; display(body); status('Borrador guardado. La bienvenida activa conserva su configuración.')
    } catch (error) { status(errorMessage(error), true) }
    finally { busy = false; update() }
  })
  $('publish').addEventListener('click', async () => {
    if (busy || blocked || !source?.draft || dirty() || source.draft.baseRevision !== source.published.revision) return
    pendingPublication ||= { draftRevision: source.draft.revision, expectedPublishedRevision: source.published.revision, operationId: crypto.randomUUID() }
    busy = true; update(); status('Comprobando permisos y publicando borrador…')
    try { const body = await request('/publish', 'POST', pendingPublication); pendingPublication = null; display(body); status('Borrador publicado. Web y Discord utilizan esta configuración.') }
    catch (error) { status(errorMessage(error), true) }
    finally { busy = false; update() }
  })
  $('refresh').addEventListener('click', refresh)
  $('preview').addEventListener('click', async () => {
    if (busy || !source) return
    busy = true; update(); status('Preparando vista previa…')
    try { const body = await request('/preview', 'POST', { config: values() }); $('preview-content').textContent = body.content; $('preview-panel').hidden = false; status('Vista previa con datos ficticios. No se envió ningún mensaje.') }
    catch (error) { status(errorMessage(error), true) }
    finally { busy = false; update() }
  })
  function edited() { $('preview-panel').hidden = true; update() }
  $('form').addEventListener('input', edited)
  $('form').addEventListener('change', edited)
  window.addEventListener('beforeunload', event => { if (dirty()) { event.preventDefault(); event.returnValue = '' } })
  refresh()
})()
