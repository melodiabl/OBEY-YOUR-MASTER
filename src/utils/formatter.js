/**
 * Utilidades para formateo de texto nativo de Discord y Tipografías Unicode
 */

const UNICODE_MAPS = {
  bold: {
    a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷', k: '𝗸', l: '𝗹', m: '𝗺',
    n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁', u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
    A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝', K: '𝗞', L: '𝗟', M: '𝗠',
    N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧', U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
    0: '𝟬', 1: '𝟭', 2: '𝟮', 3: '𝟯', 4: '𝟰', 5: '𝟱', 6: '𝟲', 7: '𝟳', 8: '𝟴', 9: '𝟵'
  },
  script: {
    a: '𝒶', b: '𝒷', c: '𝒸', d: '𝒹', e: '𝑒', f: '𝒻', g: '𝑔', h: '𝒽', i: '𝒾', j: '𝒿', k: '𝓀', l: '𝓁', m: '𝓂',
    n: '𝓃', o: '𝑜', p: '𝓅', q: '𝓆', r: '𝓇', s: '𝓈', t: '𝓉', u: '𝓊', v: '𝓋', w: '𝓌', x: '𝓍', y: '𝓎', z: '𝓏',
    A: '𝒜', B: 'ℬ', C: '𝒞', D: '𝒟', E: 'ℰ', F: 'ℱ', G: '𝒢', H: 'ℋ', I: 'ℐ', J: '𝒥', K: '𝒦', L: 'ℒ', M: 'ℳ',
    N: '𝒩', O: '𝒪', P: '𝒫', Q: '𝒬', R: 'ℛ', S: '𝒮', T: '𝒯', U: '𝒰', V: '𝒱', W: '𝒲', X: '𝒳', Y: '𝒴', Z: '𝒵'
  },
  gothic: {
    a: '𝔞', b: '𝔟', c: '𝔠', d: '𝔡', e: '𝔢', f: '𝔣', g: '𝔤', h: '𝔥', i: '𝔦', j: '𝔧', k: '𝔨', l: '𝔩', m: '𝔪',
    n: '𝔫', o: '𝔬', p: '𝔭', q: '𝔮', r: '𝔯', s: '𝔰', t: '𝔱', u: '𝔲', v: '𝔳', w: '𝔴', x: '𝔵', y: '𝔶', z: '𝔷',
    A: '𝔄', B: '𝔅', C: 'ℭ', D: '𝔇', E: '𝔈', F: '𝔉', G: '𝔊', H: 'ℌ', I: 'ℑ', J: '𝔍', K: '𝔎', L: '𝔏', M: '𝔐',
    N: '𝔑', O: '𝔒', P: '𝔓', Q: '𝔔', R: 'ℜ', S: '𝔖', T: '𝔗', U: '𝔘', V: '𝔙', W: '𝔚', X: '𝔛', Y: '𝔜', Z: 'ℨ'
  }
}

const convertToUnicode = (text, type) => {
  const map = UNICODE_MAPS[type]
  if (!map) return text
  return text.split('').map(char => map[char] || char).join('')
}

module.exports = {
  // Tipografías Unicode
  toBold: (text) => convertToUnicode(text, 'bold'),
  toScript: (text) => convertToUnicode(text, 'script'),
  toGothic: (text) => convertToUnicode(text, 'gothic'),

  // Encabezados (Discord Markdown v2)
  h1: (text) => `# ${text}`,
  h2: (text) => `## ${text}`,
  h3: (text) => `### ${text}`,
  
  // Estilos de bloque
  codeBlock: (text, lang = '') => `\`\`\`${lang}\n${text}\n\`\`\``,
  inlineCode: (text) => `\`${text}\``,
  quote: (text) => `> ${text}`,
  subtext: (text) => `-# ${text}`,
  
  // Estilos de texto estándar
  bold: (text) => `**${text}**`,
  italic: (text) => `*${text}*`,
  underline: (text) => `__${text}__`,
  strike: (text) => `~~${text}~~`,
  
  // Decoradores Premium
  fancyTitle: (emoji, text) => `╔══ ${emoji} ${convertToUnicode(text.toUpperCase(), 'bold')} ══╗`,
  divider: () => '▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬',
  
  // Formateadores específicos
  title: (emoji, text) => `### ${emoji} ${text}`,
  keyValue: (key, value) => `**${key}:** ${value}`,
  progressBar: (current, total, size = 10) => {
    const progress = Math.round((size * current) / total)
    const emptyProgress = size - progress
    const progressText = '▰'.repeat(progress)
    const emptyProgressText = '▱'.repeat(emptyProgress)
    return `\`${progressText}${emptyProgressText}\` ${Math.round((current / total) * 100)}%`
  }
}
