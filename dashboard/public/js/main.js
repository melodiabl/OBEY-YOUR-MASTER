// OBEY YOUR MASTER — Dashboard JS

// ── SIDEBAR MOBILE ──────────────────────────────────────────────────────────
const sidebar  = document.getElementById('sidebar')
const overlay  = document.getElementById('overlay')
const menuBtn  = document.getElementById('menuBtn')

menuBtn?.addEventListener('click', () => {
  sidebar?.classList.toggle('open')
  overlay?.classList.toggle('show')
  menuBtn.setAttribute('aria-expanded', String(sidebar?.classList.contains('open')))
})
overlay?.addEventListener('click', () => {
  sidebar?.classList.remove('open')
  overlay?.classList.remove('show')
  menuBtn?.setAttribute('aria-expanded', 'false')
})
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return
  sidebar?.classList.remove('open')
  overlay?.classList.remove('show')
  menuBtn?.setAttribute('aria-expanded', 'false')
})

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
