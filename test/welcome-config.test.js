const { test } = require('node:test')
const assert = require('node:assert/strict')
const SyncMap = require('../handlers/sync-map')
const { welcomeMessage, saveWelcomeMessage } = require('../handlers/config-service')

test('welcome precedence preserves bot settings with fallback for dashboard-only guilds', () => {
  const settings = { get: id => ({
    bot: { welcome: { msg: 'Bot', message: 'Web' }, welcomeMessage: 'Flat' },
    web: { welcome: { message: 'Web' }, welcomeMessage: 'Flat' },
    flat: { welcomeMessage: 'Flat' },
    empty: { welcome: { msg: '', message: 'Old' } },
  }[id]) }
  assert.equal(welcomeMessage(settings, 'bot'), 'Bot')
  assert.equal(welcomeMessage(settings, 'web'), 'Web')
  assert.equal(welcomeMessage(settings, 'flat'), 'Flat')
  assert.equal(welcomeMessage(settings, 'empty'), '')
})

test('Discord and web writes share message aliases and remain isolated by guild', async () => {
  const records = new Map(), writes = []
  const settings = new SyncMap({ modelName: 'Fixture', async findOneAndUpdate(filter, update) {
    writes.push(filter.guildId)
    records.set(filter.guildId, { ...records.get(filter.guildId), ...update.$set })
  } })
  await saveWelcomeMessage(settings, 'a', 'Hola {user}')
  await saveWelcomeMessage(settings, 'b', 'Otro servidor')
  assert.equal(welcomeMessage(settings, 'a'), 'Hola {user}')
  assert.equal(welcomeMessage(settings, 'b'), 'Otro servidor')
  assert.equal(records.get('a').welcomeMessage, 'Hola {user}')
  assert.equal(records.get('a')['welcome.msg'], 'Hola {user}')
  assert.equal(records.get('a')['welcome.message'], 'Hola {user}')
  assert.ok(writes.includes('b'))
})

test('invalid welcome values do not write and database failures reject the save', async () => {
  const settings = new SyncMap({ modelName: 'Fixture', async findOneAndUpdate() { throw new Error('offline') } })
  for (const message of [{ $ne: '' }, 'x'.repeat(501)]) await assert.rejects(saveWelcomeMessage(settings, 'g', message), /mensaje/i)
  assert.equal(settings.size, 0)
  await assert.rejects(saveWelcomeMessage(settings, 'g', 'Valid'), /guardar/)
})

test('the actual Discord command reports success only after storage and error on failure', async () => {
  const command = require('../slashCommands/Welcome/mensaje')
  for (const fails of [false, true]) {
    let persisted = false, payload
    const store = new SyncMap({ modelName: 'Fixture', async findOneAndUpdate() {
      if (fails) throw new Error('DB unavailable')
      persisted = true
    } })
    await command.run({ settings: store }, {
      guild: { id: 'command-guild', name: 'Fixture' }, user: { username: 'Fixture' },
      options: { getString: () => 'Hola {user}' },
      async reply(value) {
        if (!fails) assert.equal(persisted, true)
        payload = value
      },
    })
    const description = payload.embeds[0].toJSON().description
    assert.match(description, fails ? /No se pudo guardar/ : /actualizado/)
    if (fails) assert.equal(payload.ephemeral, true)
  }
})
