(function () {
  const app = document.getElementById('configuration-editor')
  if (!app) return
  const $ = name => document.getElementById(`config-${name}`)
  const copy = JSON.parse($('copy').textContent)
  const text = (key, variables = {}) => copy[key].replace(/\{([a-zA-Z]+)\}/g, (token, name) => Object.hasOwn(variables, name) ? String(variables[name]) : token)
  const fields = [...app.querySelectorAll('[data-config-field]')]
  const base = `/api/guilds/${encodeURIComponent(app.dataset.guildId)}/modules/${encodeURIComponent(app.dataset.moduleId)}`
  let source, channels = [], busy = false, blocked = false, pendingPublication, errorFocus
  const values = () => Object.fromEntries(fields.map(field => [field.dataset.configField, field.value === '' && field.dataset.nullable === 'true' ? null : field.value]))
  const equal = (a, b) => fields.every(field => a?.[field.dataset.configField] === b?.[field.dataset.configField])
  const editing = () => source?.draft?.config || source?.published.config
  const dirty = () => Boolean(source && !equal(values(), editing()))
  const channelName = id => id ? `#${channels.find(channel => channel.id === id)?.name || text('inaccessibleChannel')}` : text('disabledDelivery')
  function status(text, error = false) { $('status').textContent = text; $('status').dataset.state = error ? 'error' : 'ready' }
  function clearFieldErrors() {
    for (const field of fields) { field.removeAttribute('aria-invalid'); const error = document.getElementById(field.id + '-error'); error.hidden = true; error.textContent = '' }
  }
  function fieldErrors(names) {
    clearFieldErrors()
    const invalid = fields.filter(field => names.includes(field.dataset.configField))
    for (const field of invalid) {
      field.setAttribute('aria-invalid', 'true')
      const error = document.getElementById(field.id + '-error')
      error.textContent = text(field.dataset.configField === 'message' ? 'invalidMessage' : 'invalidChannel'); error.hidden = false
    }
    errorFocus = invalid[0] || $('status')
  }
  function valid() {
    const invalid = fields.filter(field => field.maxLength >= 0 && field.value.length > field.maxLength)
    fieldErrors(invalid.map(field => field.dataset.configField))
    if (!invalid.length) { errorFocus = null; return true }
    status(text('fieldErrorSummary'), true); errorFocus.focus(); errorFocus = null; return false
  }
  function finish() { busy = false; update(); errorFocus?.focus(); errorFocus = null }
  function update() {
    $('fields').disabled = busy || !source
    $('refresh').disabled = busy
    $('save').disabled = blocked || busy || !source
    $('publish').disabled = blocked || busy || !source?.draft || dirty() || source.draft.baseRevision !== source.published.revision
    $('preview').disabled = busy || !source
    $('discard').disabled = busy || !source || !dirty()
    app.setAttribute('aria-busy', String(busy))
    $('review-empty').hidden = !source || !equal(values(), source.published.config)
    $('diff').replaceChildren()
    if (source) for (const field of fields) {
      const key = field.dataset.configField
      const before = source.published.config[key], after = values()[key]
      if (before === after) continue
      const title = document.createElement('dt'), content = document.createElement('dd')
      title.textContent = document.querySelector(`label[for="${field.id}"]`).textContent
      content.textContent = text('publishedValue', { before: key === 'channelId' ? channelName(before) : before || text('emptyValue') }) + '\n' + text('draftValue', { after: key === 'channelId' ? channelName(after) : after || text('emptyValue') })
      $('diff').append(title, content)
    }
    $('draft-detail').textContent = !source ? '' : dirty() ? text('localChanges') : source.draft ? text('savedDraft', { revision: source.draft.revision }) : text('prepareDraft')
  }
  function display(body, preserve = false) {
    source = body
    $('published-channel').textContent = channelName(body.published.config.channelId)
    $('published-message').textContent = body.published.config.message || text('emptyMessage')
    $('published-date').textContent = body.published.updatedAt ? text('lastPublication', { date: new Date(body.published.updatedAt).toLocaleString(app.lang) }) : text('existingConfiguration')
    if (!preserve) {
      const config = editing()
      if (config.channelId && ![...$('channel').options].some(option => option.value === config.channelId)) $('channel').add(new Option(text('inaccessibleChannel'), config.channelId))
      $('channel').value = config.channelId || ''
      $('message').value = config.message
    }
    $('other-draft').hidden = !preserve || !body.draft || equal(values(), body.draft.config)
    $('other-draft').textContent = body.draft ? text('savedCurrentDraft', { channel: channelName(body.draft.config.channelId), message: body.draft.config.message }) : ''
    update()
  }
  function clear() {
    source = null; pendingPublication = null; channels = []; clearFieldErrors()
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
    if (!response.ok) throw Object.assign(new Error(value.error), { status: response.status, current: value.current, accessRevoked: value.accessRevoked === true, fields: Array.isArray(value.fields) ? value.fields : [] })
    return value
  }
  function errorMessage(error) {
    errorFocus = $('status')
    if (error.accessRevoked || [401, 404].includes(error.status) || error.status === 403 && !['configuration_permissions', 'csrf_invalid'].includes(error.message)) {
      clear(); return text('accessUnavailable')
    }
    if (error.status === 409) {
      if (error.current) display(error.current, true)
      blocked = true; $('conflict').hidden = false
      $('conflict').textContent = text('conflictDescription')
      return text('conflictStatus')
    }
    if (error.status === 400) { fieldErrors(error.fields || []); return text('invalidConfiguration') }
    if (error.message === 'configuration_permissions') return text('channelPermissions')
    blocked = true
    return text(error.message === 'csrf_invalid' ? 'invalidSession' : 'unknownResult')
  }
  async function refresh() {
    if (busy) return
    const preserve = dirty(), local = values()
    busy = true; update(); clearFieldErrors(); status(text('reading'))
    try {
      const [body, destinations] = await Promise.all([request('/config'), request('/channels')])
      channels = destinations.channels
      $('channel').replaceChildren(new Option(text('disableOption'), ''), ...channels.map(channel => new Option(`#${channel.name}`, channel.id)))
      if (preserve) {
        if (local.channelId && !channels.some(channel => channel.id === local.channelId)) $('channel').add(new Option(text('inaccessibleChannel'), local.channelId))
        $('channel').value = local.channelId || ''; $('message').value = local.message
      }
      blocked = false; $('conflict').hidden = true
      display(body, preserve)
      const reconciled = pendingPublication && body.lastPublication?.operationId === pendingPublication.operationId
      if (reconciled) pendingPublication = null
      status(text(reconciled ? 'reconciled' : preserve ? 'refreshedLocal' : body.draft ? 'draftRecovered' : 'publishedLoaded'))
    } catch (error) { status(errorMessage(error), true) }
    finally { finish() }
  }
  $('form').addEventListener('submit', async event => {
    event.preventDefault()
    if (busy || blocked || !source) return
    if (!valid()) return
    busy = true; update(); status(text('saving'))
    try {
      const body = await request('/draft', 'PUT', { config: values(), expectedDraftRevision: source.draftRevision, expectedPublishedRevision: source.published.revision })
      pendingPublication = null; display(body); status(text('draftSaved'))
    } catch (error) { status(errorMessage(error), true) }
    finally { finish() }
  })
  $('publish').addEventListener('click', async () => {
    if (busy || blocked || !source?.draft || dirty() || source.draft.baseRevision !== source.published.revision) return
    pendingPublication ||= { draftRevision: source.draft.revision, expectedPublishedRevision: source.published.revision, operationId: crypto.randomUUID() }
    busy = true; update(); status(text('publishing'))
    try { const body = await request('/publish', 'POST', pendingPublication); pendingPublication = null; display(body); status(text('publishedSuccess')) }
    catch (error) { status(errorMessage(error), true) }
    finally { finish() }
  })
  $('discard').addEventListener('click', () => {
    if (busy || !source) return
    clearFieldErrors(); display(source); $('preview-panel').hidden = true; status(text('localDiscarded'))
  })
  $('refresh').addEventListener('click', refresh)
  $('preview').addEventListener('click', async () => {
    if (busy || !source) return
    if (!valid()) return
    busy = true; update(); status(text('preparingPreview'))
    try { const body = await request('/preview', 'POST', { config: values() }); $('preview-content').textContent = body.content; $('preview-panel').hidden = false; status(text('previewSuccess')) }
    catch (error) { status(errorMessage(error), true) }
    finally { finish() }
  })
  function edited() {
    clearFieldErrors(); $('preview-panel').hidden = true; update()
    if (source && !blocked) status(text(dirty() ? 'localChanges' : source.draft ? 'draftRecovered' : 'publishedLoaded'))
  }
  $('form').addEventListener('input', edited)
  $('form').addEventListener('change', edited)
  window.addEventListener('beforeunload', event => { if (dirty()) { event.preventDefault(); event.returnValue = '' } })
  refresh()
})()
