(() => {
  const root = document.getElementById('music-nodes')
  if (!root) return
  const status = document.getElementById('nodes-status'), choice = document.getElementById('nodes-choice')
  const fields = document.getElementById('nodes-fields'), refresh = document.getElementById('nodes-refresh')
  const endpoint = '/api/player/' + encodeURIComponent(root.dataset.guildId) + '/nodes'
  const states = { online: 'Disponible', offline: 'Sin conexión', connecting: 'Conectando', disabled: 'Desactivada' }
  const errors = { no_permission: 'Necesitas permiso para administrar este servidor.', csrf_invalid: 'Recarga la página para renovar la sesión.', node_unavailable: 'La conexión dejó de estar disponible. Actualiza y elige otra.', node_not_available: 'Esta conexión no se puede seleccionar.', node_change_failed: 'No se pudo guardar el cambio. Se recuperará la preferencia anterior.' }
  async function request(options) {
    const response = await fetch(endpoint, options)
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw Error(errors[body.error] || 'No se pudieron consultar las conexiones. Vuelve a intentarlo.') }
    return response.json()
  }
  function render(data) {
    choice.replaceChildren(new Option('Automático', 'auto'))
    const list = document.getElementById('nodes-list'); list.replaceChildren()
    for (const node of data.nodes) {
      const option = new Option(node.label, node.id); option.disabled = node.status !== 'online'; choice.add(option)
      const item = document.createElement('li'), title = document.createElement('strong'), state = document.createElement('span')
      title.textContent = node.label; state.textContent = states[node.status] || 'Sin conexión'
      item.append(title, state); list.append(item)
    }
    if (!data.nodes.length) { const item = document.createElement('li'); item.textContent = 'Aún no hay conexiones públicas configuradas.'; list.append(item) }
    choice.value = data.preferenceId
    const current = data.nodes.find(node => node.id === data.currentId)
    document.getElementById('nodes-current').textContent = 'Conexión actual: ' + (current?.label || 'Automático')
    fields.disabled = false
  }
  async function load() {
    refresh.disabled = true; fields.disabled = true; status.textContent = 'Actualizando conexiones…'
    try { render(await request()); status.textContent = 'Conexiones actualizadas.' }
    catch (error) { status.textContent = error.message }
    finally { refresh.disabled = false }
  }
  document.getElementById('nodes-form').addEventListener('submit', async event => {
    event.preventDefault(); const nodeId = choice.value; fields.disabled = true; refresh.disabled = true; status.textContent = 'Guardando preferencia…'
    try { render(await request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nodeId }) })); status.textContent = 'Preferencia guardada.' }
    catch (error) { status.textContent = error.message }
    finally { fields.disabled = false; refresh.disabled = false }
  })
  refresh.addEventListener('click', load); load()
})()
