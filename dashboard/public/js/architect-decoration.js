(function (root) {
  root.initArchitectDecoration = function ({ post, state, accept, setBusy }) {
    const $ = id => document.getElementById(`architect-decoration-${id}`)
    let ready = false
    function update() {
      const current = state(), selected = current.selected && current.blueprint?.[current.selected.kind].find(item => item.id === current.selected.id)
      const scope = $('scope').value
      $('fields').disabled = current.busy || !current.blueprint || !ready
      $('preview').disabled = current.busy || !current.blueprint || !ready || (scope === 'resource' && !selected) || (scope === 'category' && selected?.type !== 4)
      $('target').textContent = scope === 'server' ? 'Se revisarán los canales, categorías y roles editables del servidor.' : scope === 'roles' ? 'Se revisarán los roles editables del servidor.' :
        selected ? `Selección: ${selected.name}${scope === 'category' ? ' y sus canales' : ''}` : 'Selecciona un recurso en el árbol para previsualizar su decoración.'
    }
    function load(catalog) {
      for (const [field, key, fallback] of [['theme', 'themes', 'minimal'], ['scope', 'scopes', 'resource'], ['density', 'densities', 'none']]) {
        const select = $(field), previous = select.value
        select.replaceChildren(...catalog[key].map(item => new Option(item.label, item.id)))
        select.value = catalog[key].some(item => item.id === previous) ? previous : fallback
      }
      ready = true; update()
    }
    $('scope').addEventListener('change', update)
    $('form').addEventListener('submit', async event => {
      event.preventDefault(); const current = state()
      if (current.busy || !current.blueprint || $('preview').disabled) return
      const choices = { theme: $('theme').value, scope: $('scope').value, decoration: $('density').value }
      if (['resource', 'category'].includes(choices.scope)) choices.resourceId = current.selected.id
      if (choices.scope === 'resource') choices.kind = current.selected.kind
      setBusy(true); $('status').textContent = 'Comparando la decoración con tu propuesta…'; $('skipped').replaceChildren()
      try {
        const body = await post('/decorate', { blueprint: current.blueprint, choices })
        accept(body)
        $('status').textContent = `${body.decoration.changed} recursos con cambios. Revisa los nombres y colores antes de guardar o confirmar.`
        const reasons = { protected: 'protegido', channel_type: 'tipo de canal conservado', role_style: 'color especial o estilo sin verificar' }
        for (const item of body.decoration.skipped) { const line = document.createElement('li'); line.textContent = `${item.name}: ${reasons[item.reason] || 'conservado'}`; $('skipped').append(line) }
      } catch (error) { $('status').textContent = error.message }
      finally { setBusy(false) }
    })
    return { load, update }
  }
})(window)
