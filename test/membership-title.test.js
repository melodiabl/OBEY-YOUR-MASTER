const test = require('node:test')
const assert = require('node:assert/strict')
const { membershipTitle } = require('../handlers/membership-title')
const member = { user: { username: 'Obey', tag: 'Obey' }, guild: { name: 'Comunidad' } }
const client = { la: { es: require('../languages/es.json'), en: require('../languages/en.json') } }

test('real Spanish and English membership titles render without translated-variable exceptions', () => {
  assert.equal(membershipTitle(client, 'es', 'welcome', member, 'variable13'), '**Bienvenido a Comunidad!**')
  assert.equal(membershipTitle(client, 'en', 'welcome', member, 'variable13'), '**Welcome to Comunidad!**')
  assert.equal(membershipTitle(client, 'es', 'leave', member, 'variable6'), '**Obey salió de Comunidad**')
})

test('unknown expressions never execute code and substituted names remain escaped text', () => {
  const custom = { la: { es: { handlers: { welcomejs: { welcome: { title: '`${process.exit(1)}`' } } } } } }
  assert.equal(membershipTitle(custom, 'es', 'welcome', member, 'title'), 'Bienvenido, Obey')
  custom.la.es.handlers.welcomejs.welcome.title = '`Hola ${member.user.username}`'
  assert.equal(membershipTitle(custom, 'es', 'welcome', { ...member, user: { username: '**nombre**' } }, 'title'), 'Hola \\*\\*nombre\\*\\*')
})

test('missing titles have a bounded fallback and preserve legacy translated aliases', () => {
  assert.equal(membershipTitle(client, 'missing', 'leave', member, 'bad'), 'Hasta pronto, Obey')
  const legacy = { la: { es: { handlers: { leavejs: { leave: { old: '`Hasta pronto ${Miembro.Usuario.tag} de ${Miembro.guild.name}`' } } } } } }
  assert.equal(membershipTitle(legacy, 'es', 'leave', member, 'old'), 'Hasta pronto Obey de Comunidad')
  assert.ok(membershipTitle(client, 'missing', 'welcome', { ...member, user: { username: '🐱'.repeat(300) } }, 'bad').length <= 256)
})
