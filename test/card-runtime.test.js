const test = require('node:test')
const assert = require('node:assert/strict')
const { createCardPool, cardPool } = require('../handlers/card-pool')
const { renderWelcomeCard, renderConfiguredWelcomeCard } = require('../handlers/cards')
test.after(async () => cardPool().close())

test('production rendering succeeds even when the parent native drawing API throws', async () => {
  const Canvas = require('@napi-rs/canvas'), original = Canvas.createCanvas
  try {
    Canvas.createCanvas = () => { throw Error('Parent must not decode or draw untrusted cards') }
    const buffer = await renderWelcomeCard({ data: { username: 'Obey', guildName: 'Guild', memberCount: 10 }, showAvatar: false })
    assert.ok(Buffer.isBuffer(buffer))
    assert.equal(require.cache[require.resolve('../handlers/card-renderer')], undefined)
  } finally { Canvas.createCanvas = original }
})

test('configured cards reserve admission before media fetch and excess work never downloads', { timeout: 5000 }, async () => {
  const instance = createCardPool({ maxQueue: 0 })
  const Canvas = require('@napi-rs/canvas'), image = Canvas.createCanvas(32, 32).toBuffer('image/png')
  let loads = 0, release, watchdog, first
  const pending = new Promise(resolve => { release = resolve })
  const member = { user: { username: 'Obey', discriminator: '0' }, guild: { id: 'g', name: 'Guild', memberCount: 10 } }
  const settings = { get: (id, key) => ({ 'welcome.pb': false, 'welcome.frame': false, 'welcome.background': 'https://cdn.discordapp.com/attachments/a/b/bg.png' })[key] }
  const media = { optional: async () => { loads++; await pending; return image } }
  try {
    first = renderConfiguredWelcomeCard(settings, member, { media, renderer: instance })
    first.catch(() => {})
    await new Promise(resolve => setImmediate(resolve))
    await Promise.race([
      assert.rejects(renderConfiguredWelcomeCard(settings, member, { media, renderer: instance }), error => error.code === 'card_queue_full'),
      new Promise((resolve, reject) => { watchdog = setTimeout(() => reject(Error('Excess work was not rejected before media fetch')), 800) }),
    ])
    assert.equal(loads, 1)
    release(); assert.ok(Buffer.isBuffer(await first))
  } finally { clearTimeout(watchdog); release(); await instance.close(); await first?.catch(() => {}) }
})

test('shutdown prevents even the fallback from posting a late message', async () => {
  const axios = require('axios'), original = axios.post
  const { EmbedBuilder, PermissionsBitField } = require('discord.js')
  const { sendMembershipCard } = require('../handlers/card-delivery')
  let sends = 0
  const channel = { id: '12345678901234567', guild: { id: '34567890123456789', members: { fetchMe: async () => ({}) } }, permissionsFor: () => new PermissionsBitField(8n) }
  try {
    axios.post = async () => { sends++; return { data: {} } }
    await assert.rejects(sendMembershipCard({ client: { token: 'fixture-only-token', _shuttingDown: true }, channel, guildId: channel.guild.id,
      embed: new EmbedBuilder().setDescription('Mensaje'), render: async () => require('@napi-rs/canvas').createCanvas(32, 32).toBuffer('image/png'),
    }), error => error.code === 'card_delivery_denied')
    assert.equal(sends, 0)
  } finally { axios.post = original }
})

test('cards runtime initializes once and closes the shared service', async () => {
  const initialize = require('../handlers/cards-runtime'), client = {}
  assert.equal(initialize(client), cardPool())
  const stop = client.stopCards
  assert.equal(initialize(client), client.cards)
  assert.equal(client.stopCards, stop)
  await client.stopCards()
  assert.equal(client.cards.state().closed, true)
})

test('a real blocked child produces one text delivery with a sanitized timeout diagnostic', async () => {
  const { deliverCardPayload } = require('../handlers/card-delivery')
  const instance = createCardPool({ workerPath: require('node:path').join(__dirname, 'helpers/card-worker-fixture.js'), timeoutMs: 600 })
  const messages = []
  try {
    const result = await deliverCardPayload({ filename: 'welcome-image.png',
      payload: { embeds: [{ description: 'Mensaje personalizado' }] },
      capabilities: async () => ({ send: true, embed: true, attach: true }),
      render: () => instance.render('welcome', { data: { username: 'hang' } }),
      send: async message => { messages.push(message); return { id: 'sent' } },
    })
    assert.equal(result.card, false)
    assert.equal(result.diagnostic, 'card_worker_timeout')
    assert.equal(messages.length, 1)
    assert.equal(messages[0].buffer, null)
    assert.equal(messages[0].payload.embeds[0].description, 'Mensaje personalizado')
    assert.equal(instance.state().active, 0)
  } finally { await instance.close() }
})

test('both slash previews avoid webhook edits and late error replies when shutdown has begun', async () => {
  const axios = require('axios'), original = axios.patch
  const guild = { id: 'g' }, user = { id: 'actor', username: 'Obey' }, member = { user, guild }
  guild.members = { fetch: async () => member }
  const values = { welcome: { channel: 'chat', msg: 'Mensaje' } }
  const client = { _shuttingDown: true, user: { id: 'app' }, settings: { get: (id, key) => key ? values[key] : values } }
  try {
    axios.patch = async () => assert.fail('Shutdown must not post an edit')
    for (const name of ['tarjeta', 'test']) await require(`../slashCommands/Welcome/${name}`).run(client, {
      guild, user, options: { getUser: () => null }, token: 'fixture-token',
      deferReply: async () => {}, editReply: async () => assert.fail('Shutdown must not post an error reply'),
    })
  } finally { axios.patch = original }
})
