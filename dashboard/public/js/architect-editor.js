;(function () {
  const app = document.getElementById('architect-app')
  if (!app) return
  const $ = id => document.getElementById(id)
  const base = `/api/architect/${encodeURIComponent(app.dataset.guildId)}`
  let source = null, editor = null, selected = null, busy = false, storageAvailable = false, draftRevision = 0, savedValue = '', hasSavedDraft = false
  let applyAvailable = false, applicationPlan = null
  let permissionRoleId = ''
  const { permissionOptions, setRolePermission, setOverwritePermission, formatPermissions } = architectPermissions
  const order = (a, b) => a.type - b.type || a.position - b.position || a.id.localeCompare(b.id)
  const labels = { name: 'Nombre', topic: 'Tema', color: 'Color', permissions: 'Permisos', overwrites: 'Permisos del canal', nsfw: 'Contenido restringido', hoist: 'Mostrar rol separado', mentionable: 'Rol mencionable' }
  function status(text, error = false) { $('architect-status').textContent = text; $('architect-status').dataset.state = error ? 'error' : 'ready' }
  function buttons() {
    $('architect-workspace').disabled = busy || !editor
    $('architect-refresh').disabled = busy
    $('architect-preview').disabled = busy || !editor
    $('architect-save').disabled = busy || !editor || !storageAvailable
    $('architect-undo').disabled = busy || !editor?.canUndo
    $('architect-redo').disabled = busy || !editor?.canRedo
    $('architect-prepare-application').disabled = busy || !editor || !applyAvailable
    $('architect-confirm-application').hidden = !applicationPlan
    $('architect-confirm-application').disabled = busy || !applicationPlan
  }
  async function request(path = '', options) {
    const response = await fetch(base + path, options)
    const body = await response.json().catch(() => ({}))
    if (!response.ok || !body.ok) {
      const messages = { revision_conflict: 'La estructura de Discord cambió. Actualiza el servidor antes de revisar o guardar.',
        draft_conflict: 'Otra pestaña guardó este borrador. Actualiza para recuperar la versión guardada.',
        no_permission: 'No tienes permiso para administrar este servidor.', not_authenticated: 'Tu sesión caducó. Inicia sesión de nuevo.',
        storage_unavailable: 'El almacenamiento de borradores no está disponible.', invalid_blueprint: 'La propuesta contiene nombres, referencias o permisos inválidos.',
        architect_unavailable: 'No se pudo leer o guardar la propuesta. Reintenta cuando el servicio esté disponible.' }
      Object.assign(messages, { application_unsupported: 'Puedes ordenar recursos existentes. Separa el orden de creaciones o cambios de categoría del mismo tipo. Permisos de categorías y planes mixtos de orden siguen pendientes.',
        application_conflict: 'La confirmación no coincide con el plan revisado. Prepara una aplicación nueva.', application_expired: 'El plan caducó. Prepara una aplicación nueva.',
        application_blocked: 'Los permisos actuales impiden aplicar esta propuesta. Revisa los controles.', apply_unavailable: 'La aplicación requiere un servidor canary habilitado.',
        jobs_unavailable: 'Los trabajos no están disponibles. El plan aún no se ha enviado.', application_not_found: 'El plan ya no está disponible. Prepara uno nuevo.' })
      if ([401, 403, 404].includes(response.status)) { applicationPlan = null; applyAvailable = false; buttons() }
      throw new Error(messages[body.error] || 'No se pudo completar la solicitud.')
    }
    return body
  }
  const post = (path, body) => request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  function changed() {
    applicationPlan = null
    $('architect-application-status').textContent = applyAvailable ? 'Puedes preparar las ediciones compatibles. Se guardará una copia antes de aplicar.' : 'La aplicación requiere un servidor canary habilitado.'
    $('architect-draft-status').textContent = JSON.stringify(editor.current()) === savedValue ? (hasSavedDraft ? `Borrador guardado · revisión ${draftRevision}` : 'Propuesta inicial · sin cambios') : 'Propuesta con cambios sin guardar'
    $('architect-change-count').textContent = 'Sin revisar'
    $('architect-preflight').replaceChildren()
    $('architect-diff').className = 'architect-empty'
    $('architect-diff').textContent = 'Revisa de nuevo para comparar esta versión de la propuesta.'
    render()
  }
  function resourceButton(resource, kind) {
    const item = document.createElement('li'), button = document.createElement('button'), symbol = document.createElement('span'), text = document.createElement('span')
    button.type = 'button'; button.className = 'architect-resource'; button.dataset.resourceId = resource.id
    button.setAttribute('aria-pressed', String(selected?.id === resource.id))
    button.setAttribute('aria-label', `${kind === 'roles' ? 'Rol' : resource.type === 4 ? 'Categoría' : resource.type === 2 ? 'Canal de voz' : 'Canal'}: ${resource.name}${editor.protected(resource.id) ? ', protegido' : ''}`)
    symbol.className = 'architect-resource-symbol'; symbol.textContent = kind === 'roles' ? '●' : resource.type === 4 ? '▤' : resource.type === 2 ? '♪' : '#'
    text.textContent = resource.name
    button.append(symbol, text)
    if (resource.id.startsWith('local:') || editor.protected(resource.id)) {
      const tag = document.createElement('span'); tag.className = 'architect-resource-tag'; tag.textContent = editor.protected(resource.id) ? 'Protegido' : 'Nuevo'; button.append(tag)
    }
    button.addEventListener('click', () => { selected = { id: resource.id, kind }; render() })
    item.append(button)
    return item
  }
  function renderPermissions(resource, role, locked, draft) {
    const available = !locked && !resource.id.startsWith('local:') && (role || [0, 2].includes(resource.type))
    $('architect-permission-fields').disabled = !available
    $('architect-permission-note').textContent = resource.id.startsWith('local:') ? 'Los recursos nuevos se crean sin permisos personalizados. Configúralos después de aplicar.' : !role && resource.type === 4 ? 'Los permisos de categorías aún no se aplican.' : 'Revisa estos cambios antes de confirmarlos. Los demás permisos y destinos guardados se conservan.'
    $('architect-overwrite-target').hidden = role
    const target = $('architect-permission-role'); target.replaceChildren()
    for (const item of draft.roles) target.append(new Option(item.name, item.id))
    if (!draft.roles.some(item => item.id === permissionRoleId)) permissionRoleId = source.guildId
    target.value = permissionRoleId
    const overwrite = !role && resource.overwrites.find(item => item.id === permissionRoleId && item.type === 0)
    const controls = $('architect-permission-controls'); controls.replaceChildren()
    for (const option of permissionOptions.filter(option => role || !['Administrator', 'ManageGuild', 'ViewAuditLog'].includes(option.key))) {
      const label = document.createElement('label'), input = document.createElement(role ? 'input' : 'select')
      label.className = 'architect-permission-control'; label.textContent = option.label; input.dataset.permissionKey = option.key
      if (role) { input.type = 'checkbox'; input.checked = Boolean(BigInt(resource.permissions) & BigInt(option.bit)) }
      else {
        input.append(new Option('Heredar', 'inherit'), new Option('Permitir', 'allow'), new Option('Denegar', 'deny'))
        input.value = BigInt(overwrite?.allow || '0') & BigInt(option.bit) ? 'allow' : BigInt(overwrite?.deny || '0') & BigInt(option.bit) ? 'deny' : 'inherit'
      }
      input.addEventListener('change', () => {
        if (!available) return
        editor.change(next => {
          const item = next[selected.kind].find(value => value.id === selected.id)
          if (role) item.permissions = setRolePermission(item.permissions, option.bit, input.checked)
          else item.overwrites = setOverwritePermission(item.overwrites, permissionRoleId, option.bit, input.value)
        }); changed()
      })
      label.append(input); controls.append(label)
    }
  }
  function render() {
    const draft = editor.current(), tree = $('architect-tree')
    tree.replaceChildren()
    const list = document.createElement('ul'), categories = draft.channels.filter(channel => channel.type === 4).sort(order)
    for (const category of categories) {
      const item = resourceButton(category, 'channels'), children = document.createElement('ul')
      for (const child of draft.channels.filter(channel => channel.parentId === category.id).sort(order)) children.append(resourceButton(child, 'channels'))
      if (children.children.length) item.append(children)
      list.append(item)
    }
    for (const channel of draft.channels.filter(channel => channel.type !== 4 && !channel.parentId).sort(order)) list.append(resourceButton(channel, 'channels'))
    tree.append(list)
    const roleHeading = document.createElement('h3'); roleHeading.className = 'architect-subtitle'; roleHeading.textContent = 'Roles'; tree.append(roleHeading)
    const roles = document.createElement('ul')
    for (const role of [...draft.roles].sort((a, b) => b.position - a.position || Number(a.id.startsWith('local:')) - Number(b.id.startsWith('local:')) || a.id.localeCompare(b.id))) roles.append(resourceButton(role, 'roles'))
    tree.append(roles)
    if (!draft.channels.length && !draft.roles.length) { const empty = document.createElement('p'); empty.className = 'architect-empty'; empty.textContent = 'Todavía no hay recursos. Añade una categoría o un canal.'; tree.append(empty) }
    $('architect-resource-count').textContent = `${draft.channels.length + draft.roles.length} recursos`
    const resource = selected && draft[selected.kind].find(item => item.id === selected.id)
    $('architect-inspector').hidden = !resource; $('architect-select-hint').hidden = Boolean(resource)
    if (resource) {
      const role = selected.kind === 'roles', category = resource.type === 4, locked = editor.protected(resource.id)
      $('architect-selection-kind').textContent = role ? 'Rol' : category ? 'Categoría' : resource.type === 2 ? 'Voz' : 'Canal'
      $('architect-name').value = resource.name; $('architect-name').disabled = locked
      $('architect-channel-fields').hidden = role
      const parent = $('architect-parent'); parent.replaceChildren(new Option('Sin categoría', ''))
      for (const item of categories) parent.append(new Option(item.name, item.id))
      parent.value = resource.parentId || ''; parent.disabled = locked || category
      $('architect-topic').value = resource.topic || ''; $('architect-topic').disabled = locked || resource.type !== 0
      $('architect-role-fields').hidden = !role; $('architect-color').value = '#' + Number(resource.color || 0).toString(16).padStart(6, '0'); $('architect-color').disabled = locked
      renderPermissions(resource, role, locked, draft)
      $('architect-protected').checked = locked
      $('architect-protected').disabled = resource.id.startsWith('local:') || (role && (resource.managed || resource.id === source.guildId)) || (!role && ![0, 2, 4].includes(resource.type))
      $('architect-locked').hidden = !locked; $('architect-edit').disabled = locked
      $('architect-up').disabled = locked; $('architect-down').disabled = locked
      $('architect-remove').hidden = !resource.id.startsWith('local:'); $('architect-remove').disabled = locked
    } else $('architect-selection-kind').textContent = ''
    buttons()
  }
  async function load() {
    if (editor && JSON.stringify(editor.current()) !== savedValue && !confirm('Actualizar descartará los cambios locales sin guardar. ¿Continuar?')) return
    busy = true; buttons(); status('Leyendo categorías, canales y roles de Discord…')
    try {
      const body = await request()
      source = body.snapshot; storageAvailable = body.storageAvailable; draftRevision = body.draft?.draftRevision || 0
      applyAvailable = Boolean(body.applyAvailable)
      const draft = body.draft && !body.draftStale ? body.draft.blueprint : null
      editor = createArchitectEditorState(source, draft); selected = null; savedValue = JSON.stringify(editor.current()); hasSavedDraft = Boolean(draft)
      const notices = [...source.warnings]
      if (body.draftStale) notices.unshift('El borrador guardado pertenece a una estructura anterior. Se ha abierto la estructura actual; el borrador anterior permanece guardado hasta que lo reemplaces.')
      if (!storageAvailable) notices.push('El almacenamiento no está disponible; puedes editar y revisar, pero aún no guardar.')
      $('architect-notice').textContent = notices.join(' '); $('architect-notice').hidden = !notices.length
      status(`Estructura consultada a las ${new Date(source.capturedAt).toLocaleTimeString()}`)
      changed()
    } catch (error) { status(error.message, true) }
    finally { busy = false; buttons() }
  }
  function format(value, draft, change) {
    if (change?.field === 'permissions') return formatPermissions(value)
    if (change?.operation === 'overwrites') return value.map(overwrite => `${draft.roles.find(role => role.id === overwrite.id)?.name || `Miembro ${overwrite.id}`}: permitir ${formatPermissions(overwrite.allow)}; denegar ${formatPermissions(overwrite.deny)}`).join(' · ') || 'Sin sobrescrituras'
    if (change?.operation === 'move' && change.kind === 'channels' && change.before.position === change.after.position) return `Categoría: ${draft.channels.find(channel => channel.id === value.parentId)?.name || 'Sin categoría'}`
    if (value == null) return 'No existe'
    if (typeof value === 'object') {
      if (value.name) return value.name + (value.parentId ? ` · Categoría: ${draft.channels.find(channel => channel.id === value.parentId)?.name || value.parentId}` : '')
      if ('position' in value) return `Orden: ${value.position}` + ('parentId' in value ? ` · Categoría: ${draft.channels.find(channel => channel.id === value.parentId)?.name || 'Sin categoría'}` : '')
      return JSON.stringify(value, null, 2)
    }
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    return String(value) || '(vacío)'
  }
  function review(body) {
    const target = $('architect-diff'); target.replaceChildren(); target.className = ''
    $('architect-change-count').textContent = `${body.diff.changes.length} cambios`
    const checks = $('architect-preflight'); checks.replaceChildren()
    if (body.preflight) for (const check of body.preflight.checks) { const line = document.createElement('p'); line.textContent = `${({passed:'✓',failed:'Bloqueado:',unknown:'Pendiente:'})[check.status]} ${check.detail}`; checks.append(line) }
    if (!body.diff.changes.length) { target.className = 'architect-empty'; target.textContent = 'La propuesta coincide con la estructura actual.'; return }
    for (const change of body.diff.changes) {
      const item = document.createElement('div'), title = document.createElement('strong'), details = document.createElement('dl')
      const name = body.blueprint[change.kind].find(resource => resource.id === change.id)?.name || change.id
      item.className = 'architect-change'
      title.textContent = `${({ create: 'Crear', update: 'Actualizar', move: 'Mover', overwrites: 'Cambiar permisos' })[change.operation]} ${name}` + (change.field ? ` · ${labels[change.field] || change.field}` : '')
      for (const [label, value] of [['Antes', change.before], ['Después', change.after]]) {
        const term = document.createElement('dt'), description = document.createElement('dd'), draft = label === 'Antes' ? source : body.blueprint
        term.textContent = label
        description.textContent = format(value, draft, change)
        details.append(term, description)
      }
      item.append(title, details); target.append(item)
    }
  }
  async function submit(save) {
    if (!editor) return
    busy = true; buttons(); status(save ? 'Validando y guardando el borrador…' : 'Comprobando la estructura actual y calculando cambios…')
    try {
      const body = await post(save ? '/draft' : '/preview', { blueprint: editor.current(), expectedRevision: draftRevision })
      review(body)
      if (save) { draftRevision = body.draftRevision; hasSavedDraft = true; savedValue = JSON.stringify(editor.current()); $('architect-draft-status').textContent = `Borrador guardado · revisión ${draftRevision}` }
      status(save ? 'Borrador guardado. Puedes recuperarlo al volver a Architect.' : 'Cambios revisados sobre la estructura actual del servidor.')
    } catch (error) { status(error.message, true) }
    finally { busy = false; buttons() }
  }
  $('architect-prepare-application').addEventListener('click', async () => {
    if (!editor || !applyAvailable) return
    applicationPlan = null; busy = true; buttons()
    try {
      const body = await post('/applications', { blueprint: editor.current() })
      applicationPlan = body.plan; review(applicationPlan.review)
      $('architect-confirm-application').textContent = `Confirmar ${applicationPlan.changes} ${applicationPlan.changes === 1 ? 'cambio' : 'cambios'}`
      $('architect-application-status').textContent = `Revisa el antes y después. La confirmación caduca a las ${new Date(applicationPlan.expiresAt).toLocaleTimeString()}. La copia previa incluirá estructura; no mensajes ni configuración de módulos.${applicationPlan.creates ? ' Los recursos nuevos usan la posición predeterminada de Discord; podrás ordenarlos en otra aplicación.' : ''}${applicationPlan.moves ? ' Los canales cambiarán de categoría conservando sus permisos; el movimiento no los cambiará.' : ''}${applicationPlan.reorders ? ' El orden se aplicará en lotes conservando IDs, permisos y recursos protegidos.' : ''}${applicationPlan.permissionChanges ? ' Incluye cambios de permisos: revisa a quién conceden o quitan acceso.' : ''}`
    } catch (error) { $('architect-application-status').textContent = error.message }
    finally { busy = false; buttons() }
  })
  $('architect-confirm-application').addEventListener('click', async () => {
    if (!applicationPlan || !confirm(`¿Aplicar los ${applicationPlan.changes} cambios revisados a este servidor? Se guardará un punto de restauración de estructura. La cancelación no revierte cambios ya realizados.`)) return
    busy = true; buttons()
    try {
      const { id, confirmation, revision } = applicationPlan
      const body = await post('/applications/confirm', { id, confirmation, revision })
      applicationPlan = null
      $('architect-application-status').textContent = `Aplicación encolada. Consulta los pasos y el resultado en Trabajos de estructura. Referencia: ${body.job.id}`
      document.dispatchEvent(new Event('obey:jobs-changed'))
    } catch (error) { $('architect-application-status').textContent = error.message }
    finally { busy = false; buttons() }
  })
  $('architect-add').addEventListener('submit', event => {
    event.preventDefault()
    const name = $('architect-new-name').value.trim(), kind = $('architect-new-kind').value, id = 'local:' + crypto.randomUUID()
    if (!name) return
    const role = kind === 'role', resource = role ? { id, name, position: 1, permissions: '0', color: 0, hoist: false, mentionable: false, managed: false }
      : { id, name, type: Number(kind), parentId: null, position: 0, topic: '', nsfw: false, bitrate: kind === '2' ? 64000 : null, userLimit: kind === '2' ? 0 : null, rateLimitPerUser: 0, overwrites: [] }
    editor.change(draft => {
      const list = role ? draft.roles : draft.channels
      if (!role && resource.type !== 4 && selected?.kind === 'channels' && draft.channels.find(item => item.id === selected.id)?.type === 4) resource.parentId = selected.id
      list.push(resource)
    })
    selected = { id, kind: role ? 'roles' : 'channels' }; $('architect-new-name').value = ''; changed()
  })
  $('architect-inspector').addEventListener('submit', event => {
    event.preventDefault(); if (!selected || editor.protected(selected.id)) return
    const name = $('architect-name').value.trim(), parent = $('architect-parent').value || null, topic = $('architect-topic').value, color = parseInt($('architect-color').value.slice(1), 16)
    editor.change(draft => { const resource = draft[selected.kind].find(item => item.id === selected.id); resource.name = name; if (selected.kind === 'roles') resource.color = color; else { if (resource.type !== 4) resource.parentId = parent; if (resource.type === 0) resource.topic = topic } }); changed()
  })
  function move(direction) {
    if (!selected || editor.protected(selected.id)) return
    if (editor.move(selected.kind, selected.id, direction)) changed()
    else status('No se puede mover en esa dirección sin alterar un recurso protegido o su orden.', true)
  }
  $('architect-up').addEventListener('click', () => move(-1)); $('architect-down').addEventListener('click', () => move(1))
  $('architect-protected').addEventListener('change', () => { editor.change(draft => { draft.protectedIds = draft.protectedIds.filter(id => id !== selected.id); if ($('architect-protected').checked) draft.protectedIds.push(selected.id) }); changed() })
  $('architect-remove').addEventListener('click', () => { if (editor.remove(selected.id)) { selected = null; changed() } else status('Quita primero los recursos nuevos que dependen de este recurso.', true) })
  $('architect-permission-role').addEventListener('change', () => { permissionRoleId = $('architect-permission-role').value; render() })
  $('architect-undo').addEventListener('click', () => { editor.undo(); changed() }); $('architect-redo').addEventListener('click', () => { editor.redo(); changed() })
  $('architect-refresh').addEventListener('click', load); $('architect-preview').addEventListener('click', () => submit(false)); $('architect-save').addEventListener('click', () => submit(true))
  window.addEventListener('beforeunload', event => { if (editor && JSON.stringify(editor.current()) !== savedValue) { event.preventDefault(); event.returnValue = '' } })
  load()
})()
