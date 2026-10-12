(function () {
  const app = document.getElementById('help-app')
  if (!app) return
  const $ = id => document.getElementById('help-' + id), endpoint = '/api/help/' + encodeURIComponent(app.dataset.guildId)
  let page = 0, pages = 1, busy = false, revoked = false
  function controls() { $('fields').disabled = busy || revoked; $('prev').disabled = busy || revoked || page === 0; $('next').disabled = busy || revoked || page === pages - 1; $('refresh').disabled = busy; app.setAttribute('aria-busy', String(busy)) }
  function clear() { $('list').replaceChildren(); $('detail').hidden = true; $('detail-description').textContent = ''; $('detail-fields').replaceChildren(); $('detail-title').textContent = ''; $('page').textContent = '' }
  function status(value, error = false) { $('status').textContent = value; $('status').dataset.state = error ? 'error' : 'ready' }
  async function request(query = '') {
    const response = await fetch(endpoint + query), body = await response.json()
    if (!response.ok) throw Object.assign(new Error(body.error), { status: response.status })
    return body
  }
  function params() {
    return new URLSearchParams({ search: $('search').value, category: $('category').value, channelId: $('channel').value, page: String(page) })
  }
  function failure(error) {
    clear()
    revoked = true
    status([401, 403, 404].includes(error.status) ? 'Tu acceso a esta ayuda ya no está disponible.' : 'No pude verificar los permisos actuales. Actualiza para reintentar.', true)
  }
  async function details(entry) {
    if (busy || revoked) return
    busy = true; controls(); status('Comprobando el comando…')
    try {
      const query = params(); query.set('command', entry.id)
      const body = await request('?' + query)
      if (!body.detail) { $('detail').hidden = true; status('Ese comando ya no está disponible en este contexto. Actualiza la lista.'); return }
      const command = body.detail
      $('detail-title').textContent = command.transport === 'prefix' ? body.prefix + command.name : command.invocation
      $('detail-description').textContent = command.description
      $('detail-fields').replaceChildren()
      for (const [label, value] of [['Uso', (command.transport === 'prefix' ? body.prefix : '') + command.usage], ['Alias', command.aliases.join(', ') || 'Sin alias'], ['Permisos declarados', command.permissions.join(', ') || 'Sin permisos adicionales declarados'], ['Espera entre usos', command.cooldownSeconds + ' s']]) {
        const term = document.createElement('dt'), description = document.createElement('dd'); term.textContent = label; description.textContent = value; $('detail-fields').append(term, description)
      }
      $('detail').hidden = false; $('detail-title').tabIndex = -1; $('detail-title').focus(); status('Requisitos actuales del comando cargados.')
    } catch (error) { failure(error) }
    finally { busy = false; controls() }
  }
  async function load(refresh = false) {
    if (busy) return
    busy = true; controls(); $('detail').hidden = true; status('Comprobando comandos y permisos…')
    try {
      if (refresh) {
        const result = await request('/channels'), selected = $('channel').value
        $('channel').replaceChildren(new Option('Vista general del servidor', ''), ...result.channels.map(channel => new Option('#' + channel.name, channel.id)))
        if ([...$('channel').options].some(option => option.value === selected)) $('channel').value = selected
        else if (selected) { $('channel').add(new Option('Canal eliminado o inaccesible', selected)); $('channel').value = selected }
      }
      const body = await request('?' + params()), selected = $('category').value
      revoked = false; page = body.page; pages = body.pages
      $('category').replaceChildren(new Option('Todas las categorías', ''), ...body.categories.map(category => new Option(category, category)))
      if (selected) {
        if (!body.categories.includes(selected)) $('category').add(new Option(selected + ' · Sin comandos en este contexto', selected))
        $('category').value = selected
      }
      $('list').replaceChildren()
      for (const command of body.commands) {
        const card = document.createElement('article'); card.className = 'card help-command'
        const title = document.createElement('h2'), description = document.createElement('p'), category = document.createElement('p'), button = document.createElement('button')
        title.textContent = command.transport === 'prefix' ? body.prefix + command.name : command.invocation
        description.textContent = command.description; category.className = 'help-note'; category.textContent = command.category + ' · ' + (command.transport === 'prefix' ? 'Prefijo' : 'Slash')
        button.type = 'button'; button.className = 'btn btn-sec'; button.textContent = 'Consultar requisitos'; button.addEventListener('click', () => details(command))
        card.append(title, description, category, button); $('list').append(card)
      }
      $('page').textContent = 'Página ' + (page + 1) + ' de ' + pages
      status(body.total ? body.total + ' comandos coinciden con tu consulta.' : 'No hay comandos disponibles para esta búsqueda y contexto.')
    } catch (error) { failure(error) }
    finally { busy = false; controls() }
  }
  $('filters').addEventListener('submit', event => { event.preventDefault(); page = 0; load() })
  $('prev').addEventListener('click', () => { if (!busy && page > 0) { page--; load() } })
  $('next').addEventListener('click', () => { if (!busy && page < pages - 1) { page++; load() } })
  $('refresh').addEventListener('click', () => load(true))
  $('close').addEventListener('click', () => { $('detail').hidden = true; $('search').focus() })
  load(true)
})()
