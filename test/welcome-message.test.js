const { test } = require('node:test')
const assert = require('node:assert/strict')
const { renderWelcomeMessage } = require('../handlers/welcome-message')

test('welcome renders both web and Discord variables, including every repeated occurrence', () => {
  const user = { username: 'Álex', toString: () => '<@123>' }
  const guild = { name: 'Servidor 🎵', memberCount: 42 }
  assert.equal(renderWelcomeMessage('{user} {username} {usertag} {guild} {server} {count} {user}', user, guild),
    '<@123> Álex Álex Servidor 🎵 Servidor 🎵 42 <@123>')
})

test('user content is inserted once as data and unknown variables remain intact', () => {
  assert.equal(renderWelcomeMessage('{username} {guild} {unknown}', { username: '{guild} $&' }, { name: 'Test' }),
    '{guild} $& Test {unknown}')
})
