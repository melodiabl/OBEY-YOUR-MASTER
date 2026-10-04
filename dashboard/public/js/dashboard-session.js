// Shared CSRF transport for internal dashboard pages.
(function () {
  const token = document.querySelector('meta[name="csrf-token"]')?.content
  if (!token) return
  const originalFetch = window.fetch.bind(window)
  window.fetch = function (input, options = {}) {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href)
    const method = (options.method || input.method || 'GET').toUpperCase()
    if (url.origin === location.origin && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const headers = new Headers(options.headers || input.headers)
      headers.set('X-CSRF-Token', token)
      return originalFetch(input, { ...options, headers })
    }
    return originalFetch(input, options)
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form[method="POST"], form[method="post"]').forEach(form => {
      if (form.querySelector('[name="_csrf"]')) return
      const field = document.createElement('input')
      field.type = 'hidden'; field.name = '_csrf'; field.value = token
      form.appendChild(field)
    })
  })
})()
