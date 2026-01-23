/**
 * Utilidades de formateo (Markdown nativo de Discord).
 * Evita "fuentes" Unicode para mantener legibilidad y consistencia visual.
 */

function s (v) {
  return String(v ?? '')
}

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function repeat (ch, size, min = 8, max = 40) {
  return s(ch).slice(0, 1).repeat(clamp(size, min, max))
}

module.exports = {
  // Legacy (se mantiene el API, pero es Markdown nativo)
  toBold: (text) => `**${s(text)}**`,
  toScript: (text) => `*${s(text)}*`,
  toGothic: (text) => `**${s(text)}**`,

  // Encabezados
  h1: (text) => `# ${s(text)}`,
  h2: (text) => `## ${s(text)}`,
  h3: (text) => `### ${s(text)}`,

  // Bloques
  codeBlock: (text, lang = '') => `\`\`\`${s(lang)}\n${s(text)}\n\`\`\``,
  inlineCode: (text) => `\`${s(text)}\``,
  quote: (text) => `> ${s(text)}`,
  subtext: (text) => `-# ${s(text)}`,

  // Estilos
  bold: (text) => `**${s(text)}**`,
  italic: (text) => `*${s(text)}*`,
  underline: (text) => `__${s(text)}__`,
  strike: (text) => `~~${s(text)}~~`,

  // Separadores
  divider: (size = 22) => repeat('━', size),
  softDivider: (size = 22) => repeat('─', size),

  // Decoradores
  fancyTitle: (emoji, text) => `${s(emoji)} **${s(text)}**`,
  title: (emoji, text) => `### ${s(emoji)} ${s(text)}`,
  keyValue: (key, value) => `**${s(key)}:** ${s(value)}`,

  progressBar: (current, total, size = 10) => {
    const t = Math.max(1, Number(total) || 1)
    const c = clamp(current, 0, t)
    const blocks = clamp(size, 5, 20)
    const filled = Math.round((blocks * c) / t)
    const empty = blocks - filled
    const bar = `${'▰'.repeat(filled)}${'▱'.repeat(empty)}`
    const pct = Math.round((c / t) * 100)
    return `\`${bar}\` ${pct}%`
  }
}
