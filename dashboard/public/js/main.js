// OBEY YOUR MASTER — Dashboard JS

// ── SIDEBAR MOBILE ──────────────────────────────────────────────────────────
const sidebar  = document.getElementById('sidebar')
const overlay  = document.getElementById('overlay')
const menuBtn  = document.getElementById('menuBtn')

const mobileNavigation = matchMedia('(max-width:980px)')
const navigationBackground = ['main-content', 'panel-topbar', 'panel-footer'].map(id => document.getElementById(id)).filter(Boolean)
function setNavigation(open, restoreFocus = false) {
  open = Boolean(open && mobileNavigation.matches)
  sidebar?.classList.toggle('open', open)
  overlay?.classList.toggle('show', open)
  document.body.classList.toggle('menu-open', open)
  if (sidebar) {
    sidebar.inert = mobileNavigation.matches && !open
    sidebar.toggleAttribute('aria-hidden', sidebar.inert)
    if (sidebar.inert) sidebar.setAttribute('aria-hidden', 'true')
  }
  navigationBackground.forEach(element => { element.inert = open })
  menuBtn?.setAttribute('aria-expanded', String(open))
  menuBtn?.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación')
  if (open) sidebar?.querySelector('a')?.focus()
  else if (restoreFocus) menuBtn?.focus()
}
menuBtn?.addEventListener('click', () => setNavigation(!sidebar?.classList.contains('open'), true))
overlay?.addEventListener('click', () => setNavigation(false, true))
mobileNavigation.addEventListener('change', () => setNavigation(false))
document.addEventListener('keydown', event => {
  if (!sidebar?.classList.contains('open')) return
  if (event.key === 'Escape') { event.preventDefault(); setNavigation(false, true); return }
  if (event.key !== 'Tab') return
  const controls = [menuBtn, ...sidebar.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled)')].filter(element => element && element.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
})
setNavigation(false)

// ── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const container = document.getElementById('toasts')
  if (!container) return
  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle' }
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `<i class="fas ${icons[type]||icons.ok}"></i><span></span>`
  el.querySelector('span').textContent = msg
  container.appendChild(el)
  setTimeout(() => {
    el.classList.add('toast-out')
    setTimeout(() => el.remove(), 250)
  }, 3200)
}

// ── FORM FEEDBACK ───────────────────────────────────────────────────────────
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', event => {
    if (event.defaultPrevented) return
    const btn = form.querySelector('[type=submit]')
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'
    }
  })
})

// Connect visible field labels to controls for screen readers and pointer input.
document.querySelectorAll('.form-group').forEach((group, index) => {
  const label = group.querySelector('label')
  const control = group.querySelector('input:not([type=hidden]),select,textarea')
  if (!label || !control || label.control) return
  control.id ||= `settings-field-${index}`
  label.htmlFor = control.id
})
