const { BlueprintError } = require('./blueprint')
const communities = [
  ['gaming', 'Gaming', ['games', 'clips']], ['community', 'Comunidad', ['introductions', 'suggestions']],
  ['anime', 'Anime', ['anime', 'art']], ['music', 'Música', ['music', 'recommendations']],
  ['creative', 'Creativos', ['projects', 'art']], ['development', 'Desarrollo', ['projects', 'help']],
  ['study', 'Estudio', ['resources', 'help']], ['roleplay', 'Roleplay', ['characters', 'stories']],
  ['support', 'Soporte', ['help', 'resources']], ['custom', 'Personalizado', ['introductions', 'projects']],
]
const themes = [['midnight', 'Midnight', 0x64748b, '🌙'], ['minimal', 'Minimal', 0x94a3b8, ''], ['sakura', 'Sakura', 0xf9a8d4, '🌸'],
  ['nebula', 'Nebula', 0xa78bfa, '✨'], ['gaming', 'Gaming', 0x22c55e, '🎮'], ['luxury', 'Luxury', 0xd4af37, '◆'], ['obey', 'OBEY', 0xd6b567, '✦']]
const names = {
  es: { information: 'Información', community: 'Comunidad', rules: 'reglas', announcements: 'anuncios', general: 'general', introductions: 'presentaciones', suggestions: 'sugerencias', games: 'juegos', clips: 'clips', anime: 'anime', art: 'arte', recommendations: 'recomendaciones', music: 'música', projects: 'proyectos', help: 'ayuda', resources: 'recursos', characters: 'personajes', stories: 'historias', events: 'eventos', voice: 'Sala de voz', member: 'Miembro', welcome: 'bienvenida' },
  en: { information: 'Information', community: 'Community', rules: 'rules', announcements: 'announcements', general: 'general', introductions: 'introductions', suggestions: 'suggestions', games: 'games', clips: 'clips', anime: 'anime', art: 'art', recommendations: 'recommendations', music: 'music', projects: 'projects', help: 'help', resources: 'resources', characters: 'characters', stories: 'stories', events: 'events', voice: 'Voice room', member: 'Member', welcome: 'welcome' },
  pt: { information: 'Informações', community: 'Comunidade', rules: 'regras', announcements: 'anúncios', general: 'geral', introductions: 'apresentações', suggestions: 'sugestões', games: 'jogos', clips: 'clipes', anime: 'anime', art: 'arte', recommendations: 'recomendações', music: 'música', projects: 'projetos', help: 'ajuda', resources: 'recursos', characters: 'personagens', stories: 'histórias', events: 'eventos', voice: 'Sala de voz', member: 'Membro', welcome: 'boas-vindas' },
}
function wizardCatalog() {
  return { communities: communities.map(([id, label]) => ({ id, label })), themes: themes.map(([id, label]) => ({ id, label })),
    sizes: [{ id: 'small', label: 'Pequeño · lo esencial' }, { id: 'medium', label: 'Mediano · espacios por actividad' }, { id: 'large', label: 'Grande · actividades y eventos' }],
    languages: [{ id: 'es', label: 'Español' }, { id: 'en', label: 'English' }, { id: 'pt', label: 'Português' }],
    decorations: [{ id: 'none', label: 'Sin decoración' }, { id: 'subtle', label: 'Solo categorías' }, { id: 'expressive', label: 'Categorías y canales' }],
    spaces: [{ id: 'welcome', label: 'Canal de bienvenida' }, { id: 'music', label: 'Texto y voz para música' }], configuresModules: false }
}
function generateProposal(input, options) {
  const fail = message => { throw new BlueprintError(message, 'invalid_wizard') }
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some(key => !['community', 'theme', 'size', 'language', 'decoration', 'spaces', 'title'].includes(key))) fail('Invalid wizard choices')
  const community = communities.find(([id]) => id === options.community), theme = themes.find(([id]) => id === options.theme)
  if (!community || !theme || !Object.hasOwn(names, options.language) || !['small', 'medium', 'large'].includes(options.size) || !['none', 'subtle', 'expressive'].includes(options.decoration)) fail('Unsupported wizard choices')
  if (!Array.isArray(options.spaces) || options.spaces.length > 2 || new Set(options.spaces).size !== options.spaces.length || options.spaces.some(id => !['welcome', 'music'].includes(id))) fail('Unsupported wizard spaces')
  if (options.title !== undefined && (typeof options.title !== 'string' || options.title.trim().length > 60)) fail('Invalid wizard title')
  if (options.community === 'custom' && !options.title?.trim()) fail('Custom wizard requires a title')
  const blueprint = structuredClone(input), labels = names[options.language], protectedIds = new Set(blueprint.protectedIds || [])
  const decorate = (name, category) => theme[3] && (options.decoration === 'expressive' || (category && options.decoration === 'subtle')) ? `${theme[3]}・${name}` : name
  const initial = { channels: blueprint.channels.length, roles: blueprint.roles.length }
  function channel(key, type, name, parent = null) {
    const id = `local:setup-${key}`, title = decorate(name, type === 4)
    const existing = blueprint.channels.find(item => item.id === id || (item.type === type && item.name === title && item.parentId === (parent?.id || null)))
    if (existing) return existing
    if (parent && (parent.overwrites.length || protectedIds.has(parent.id))) fail('Wizard category is private or protected; choose a different base or edit explicitly')
    const result = { id, name: title, type, parentId: parent?.id || null, position: 0, topic: '', nsfw: false,
      bitrate: type === 2 ? 64000 : null, userLimit: type === 2 ? 0 : null, rateLimitPerUser: 0, overwrites: [] }
    blueprint.channels.push(result); return result
  }
  const information = channel('information', 4, labels.information)
  for (const key of ['rules', 'announcements', ...(options.spaces.includes('welcome') ? ['welcome'] : [])]) channel(key, 0, labels[key], information)
  const social = channel('community', 4, options.community === 'custom' ? options.title.trim() : labels.community)
  const activities = options.size === 'small' ? community[2].slice(0, 1) : community[2]
  for (const key of new Set(['general', ...activities, ...(options.size === 'large' ? ['events'] : []), ...(options.spaces.includes('music') ? ['music'] : [])])) channel(key, 0, labels[key], social)
  channel('voice', 2, labels.voice, social)
  if (options.spaces.includes('music') || options.community === 'music') channel('music-voice', 2, labels.music, social)
  const roleId = 'local:setup-member'
  if (!blueprint.roles.some(role => role.id === roleId || role.name === labels.member)) blueprint.roles.push({ id: roleId, name: labels.member, position: 1,
    permissions: '0', color: theme[2], hoist: false, mentionable: false, managed: false })
  return { blueprint, wizard: { choices: structuredClone(options), addedChannels: blueprint.channels.length - initial.channels,
    addedRoles: blueprint.roles.length - initial.roles, configuresModules: false } }
}
module.exports = { wizardCatalog, generateProposal }
