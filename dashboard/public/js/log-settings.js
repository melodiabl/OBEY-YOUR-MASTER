(() => {
  const form = document.getElementById('logs-settings-form')
  if (!form) return
  const save = document.getElementById('logs-save'), discard = document.getElementById('logs-discard'), reload = document.getElementById('logs-reload'), status = document.getElementById('logs-status')
  const categories = ['messages', 'members', 'moderation', 'voice', 'server']
  const errors = { setup_denied: 'Ya no tienes permiso para administrar estos registros.', setup_resource: 'Revisa los canales seleccionados y sus permisos de acceso y envío.', setup_conflict: 'La configuración cambió desde otro panel. Tus cambios siguen aquí; descarta y recarga para revisar lo guardado.', invalid_setup: 'Revisa los valores antes de guardar.', csrf_invalid: 'Recarga la página para renovar la sesión.', setup_storage: 'No se pudo confirmar el guardado. Comprueba el estado antes de repetirlo.', setup_unavailable: 'El bot está iniciando o cerrando. Vuelve a intentarlo en unos segundos.' }
  let busy = false
  const changed = () => { if (!busy) { save.disabled = false; discard.disabled = false; status.textContent = 'Cambios de registros pendientes de guardar.' } }
  for (const element of form.elements) element.addEventListener('change', changed)
  function remember() {
    for (const element of form.elements) {
      if (element.options) for (const option of element.options) option.defaultSelected = option.selected
      else if (element.type === 'checkbox') element.defaultChecked = element.checked
      else element.defaultValue = element.value
    }
  }
  function patch() {
    const value = { defaultChannel: form.elements.defaultChannel.value, includeMessageContent: form.elements.includeMessageContent.checked,
      excludedChannelIds: [...form.elements.excludedChannelIds.selectedOptions].map(option => option.value) }
    for (const key of categories) value[key] = form.elements[key].value === 'inherit' ? null : form.elements[key].value
    return value
  }
  function ensureOption(select, value) {
    if ([...select.options].some(option => option.value === value)) return
    select.add(new Option('Canal guardado no disponible · ' + value, value))
  }
  async function request(options) {
    const response = await fetch(form.dataset.configUrl, options)
    const data = await response.json()
    if (!response.ok) throw Object.assign(new Error(data.error || 'setup_storage'), { status: response.status })
    return data
  }
  discard.addEventListener('click', () => { form.reset(); save.disabled = true; discard.disabled = true; status.textContent = 'Cambios locales descartados.' })
  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (busy) return
    busy = true; save.disabled = true; discard.disabled = true; status.textContent = 'Guardando registros…'
    try {
      const result = await request({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patch: patch(), revision: form.elements.revision.value }) })
      form.elements.revision.value = result.revision; remember(); reload.hidden = true; status.textContent = 'Registros guardados.'
    } catch (error) { status.textContent = errors[error.message] || errors.setup_storage; reload.hidden = false; save.disabled = error.status === 403; discard.disabled = false }
    finally { busy = false }
  })
  reload.addEventListener('click', async () => {
    if (busy) return
    busy = true; reload.disabled = true; save.disabled = true; status.textContent = 'Consultando configuración actual…'
    try {
      const result = await request({ method: 'GET' })
      for (const key of ['defaultChannel', ...categories]) {
        const value = result.values[key] == null ? 'inherit' : result.values[key]
        ensureOption(form.elements[key], value); form.elements[key].value = value
      }
      form.elements.includeMessageContent.checked = result.values.includeMessageContent
      for (const value of result.values.excludedChannelIds) ensureOption(form.elements.excludedChannelIds, value)
      for (const option of form.elements.excludedChannelIds.options) option.selected = result.values.excludedChannelIds.includes(option.value)
      form.elements.revision.value = result.revision; remember(); discard.disabled = true; reload.hidden = true; status.textContent = 'Configuración actual cargada.'
    } catch (error) { status.textContent = errors[error.message] || errors.setup_storage }
    finally { busy = false; reload.disabled = false }
  })
})()
