// Auto-hide success/error banners after 4s
document.querySelectorAll('.badge.success').forEach(el => {
  setTimeout(() => el.style.opacity = '0', 4000)
})
