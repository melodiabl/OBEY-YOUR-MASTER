function splitMessage(text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
  const limit = maxLength - prepend.length - append.length
  if (limit < 1) throw new Error('Message wrapper exceeds maximum length')
  const chunks = []
  let remaining = String(text)
  while (remaining.length > limit) {
    const split = remaining.lastIndexOf(char, limit)
    const at = split > 0 ? split : limit
    chunks.push(prepend + remaining.slice(0, at) + append)
    remaining = remaining.slice(at + (split > 0 ? char.length : 0))
  }
  if (remaining || !chunks.length) chunks.push(prepend + remaining + append)
  return chunks
}
module.exports = { splitMessage }
