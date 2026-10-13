// Filters the already-authorized server list; no remote queries or session data.
;(function () {
  const search = document.getElementById('servers-search')
  const filter = document.getElementById('servers-filter')
  if (!search || !filter) return
  const cards = [...document.querySelectorAll('[data-server-name]')]
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
  function update() {
    const term = normalize(search.value.trim())
    let visible = 0
    cards.forEach(card => {
      const installed = card.dataset.installed === 'true'
      const matchesFilter = filter.value === 'all' || (filter.value === 'active' ? installed : !installed)
      card.hidden = !(matchesFilter && normalize(card.dataset.serverName).includes(term))
      if (!card.hidden) visible++
    })
    document.getElementById('servers-results').textContent = `${visible} de ${cards.length} servidores`
    document.getElementById('servers-no-results').hidden = visible !== 0
  }
  search.addEventListener('input', update)
  filter.addEventListener('change', update)
  update()
})()
