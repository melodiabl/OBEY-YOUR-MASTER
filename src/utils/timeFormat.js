function formatDuration (ms) {
  if (isNaN(ms) || ms < 0) return '00:00'
  const seconds = Math.floor((ms / 1000) % 60)
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor(ms / (1000 * 60 * 60))

  const parts = []
  if (hours > 0) parts.push(String(hours).padStart(2, '0'))
  parts.push(String(minutes).padStart(2, '0'))
  parts.push(String(seconds).padStart(2, '0'))

  return parts.join(':')
}

module.exports = { formatDuration }
