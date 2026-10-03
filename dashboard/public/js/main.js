// OBEY YOUR MASTER — Dashboard JS

// ── SIDEBAR MOBILE ──────────────────────────────────────────────────────────
const sidebar  = document.getElementById('sidebar')
const overlay  = document.getElementById('overlay')
const menuBtn  = document.getElementById('menuBtn')

menuBtn?.addEventListener('click', () => {
  sidebar?.classList.toggle('open')
  overlay?.classList.toggle('show')
})
overlay?.addEventListener('click', () => {
  sidebar?.classList.remove('open')
  overlay?.classList.remove('show')
})

// ── TOAST ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const container = document.getElementById('toasts')
  if (!container) return
  const icons = { ok: 'fa-check-circle', err: 'fa-exclamation-circle' }
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `<i class="fas ${icons[type]||icons.ok}"></i><span>${msg}</span>`
  container.appendChild(el)
  setTimeout(() => {
    el.classList.add('toast-out')
    setTimeout(() => el.remove(), 250)
  }, 3200)
}

// ── FORM FEEDBACK ───────────────────────────────────────────────────────────
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', () => {
    const btn = form.querySelector('[type=submit]')
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'
    }
  })
})
