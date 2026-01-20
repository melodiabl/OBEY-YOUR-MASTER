/**
 * Utilidades para formateo de texto nativo de Discord
 */
module.exports = {
  // Encabezados (Discord Markdown v2)
  h1: (text) => `# ${text}`,
  h2: (text) => `## ${text}`,
  h3: (text) => `### ${text}`,
  
  // Estilos de bloque
  codeBlock: (text, lang = '') => `\`\`\`${lang}\n${text}\n\`\`\``,
  inlineCode: (text) => `\`${text}\``,
  quote: (text) => `> ${text}`,
  subtext: (text) => `-# ${text}`, // Discord subtext markdown
  
  // Estilos de texto
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  underline: (text) => `__${text}__`,
  strike: (text) => `~~${text}~~`,
  spoiler: (text) => `||${text}||`,
  
  // Listas
  list: (items) => items.map(i => `• ${i}`).join('\n'),
  numberedList: (items) => items.map((i, index) => `${index + 1}. ${i}`).join('\n'),

  // Formateadores específicos
  title: (emoji, text) => `### ${emoji} ${text}`,
  keyValue: (key, value) => `**${key}:** ${value}`,
  progressBar: (current, total, size = 10) => {
    const progress = Math.round((size * current) / total)
    const emptyProgress = size - progress
    const progressText = '▇'.repeat(progress)
    const emptyProgressText = '—'.repeat(emptyProgress)
    return `\`[${progressText}${emptyProgressText}]\` ${Math.round((current / total) * 100)}%`
  }
}
