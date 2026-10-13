const test = require('node:test')
const assert = require('node:assert/strict')
const { createCanvas } = require('@napi-rs/canvas')
const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const { deliverCardPayload, sendMembershipCard } = require('../handlers/card-delivery')
const png = createCanvas(32, 32).toBuffer('image/png')
const payload = { content: '<@12345678901234567>', embeds: [{ title: 'Bienvenido', description: 'Mensaje personalizado', image: { url: 'attachment://old.png' }, footer: { text: 'OBEY' } }] }
const filename = 'welcome-image.png'
const capabilities = async () => ({ send: true, embed: true, attach: true })

test('render failure still sends the configured text without a broken attachment reference', async () => {
  const messages = []
  const result = await deliverCardPayload({ payload, filename, capabilities,
    render: async () => { throw Error('private provider URL and token') }, send: async message => { messages.push(message); return { id: 'sent' } },
  })
  assert.equal(result.card, false)
  assert.equal(result.reason, 'render_failed')
  assert.equal(messages.length, 1)
  assert.equal(messages[0].payload.embeds[0].description, 'Mensaje personalizado')
  assert.equal(messages[0].payload.embeds[0].image, undefined)
  assert.equal(messages[0].buffer, null)
  assert.equal(payload.embeds[0].image.url, 'attachment://old.png')
})

test('an explicit rejected attachment gets exactly one text fallback', async () => {
  const messages = []
  const result = await deliverCardPayload({ payload, filename, capabilities, render: async () => png,
    send: async message => { messages.push(message); if (message.buffer) throw { response: { status: 413 } }; return { id: 'sent' } },
  })
  assert.equal(result.reason, 'attachment_rejected')
  assert.equal(messages.length, 2)
  assert.equal(messages[0].payload.embeds[0].image.url, 'attachment://welcome-image.png')
  assert.equal(messages[1].payload.embeds[0].image, undefined)
  assert.equal(messages[1].buffer, null)
})

test('missing AttachFiles skips rendering, and missing EmbedLinks preserves message content', async () => {
  const messages = []
  await deliverCardPayload({ payload, filename, capabilities: async () => ({ send: true, attach: false, embed: false }),
    render: () => assert.fail('Must not render an unusable attachment'), send: async message => { messages.push(message) },
  })
  assert.equal(messages.length, 1)
  assert.equal(messages[0].payload.embeds.length, 0)
  assert.ok(messages[0].payload.content.includes('Mensaje personalizado'))
  assert.equal(messages[0].payload.allowed_mentions.parse.length, 0)
})

test('revocation during render stops sending and authorization or uncertain errors never duplicate a post', async () => {
  let checks = 0, sends = 0
  await assert.rejects(deliverCardPayload({ payload, filename, capabilities: async () => ({ send: ++checks === 1, embed: true, attach: true }),
    render: async () => png, send: async () => { sends++ },
  }), error => error.code === 'card_delivery_denied')
  assert.equal(sends, 0)
  for (const error of [{ response: { status: 403 } }, { response: { status: 429 } }, { response: { status: 500 } }, Error('request timed out')]) {
    let calls = 0
    await assert.rejects(deliverCardPayload({ payload, filename, capabilities, render: async () => png,
      send: async () => { calls++; throw error },
    }), value => value.code === 'card_delivery_failed')
    assert.equal(calls, 1)
  }
})

test('fallback failure is terminal, sanitized, and capped at two sends', async () => {
  let calls = 0
  await assert.rejects(deliverCardPayload({ payload, filename, capabilities, render: async () => png,
    send: async () => { calls++; throw { response: { status: 400 }, message: 'secret token' } },
  }), error => error.code === 'card_delivery_failed' && !error.message.includes('secret'))
  assert.equal(calls, 2)
})

test('real channel adapter retains nonce, uses PNG multipart then JSON fallback, and refreshes bot permissions', async () => {
  const axios = require('axios'), original = axios.post, messages = []
  let fetches = 0
  const channel = { id: '12345678901234567', guild: { id: '34567890123456789', members: { fetchMe: async options => { assert.equal(options.force, true); fetches++; return {} } } },
    permissionsFor: () => new PermissionsBitField(8n) }
  const client = { token: 'fixture-only-token' }
  try {
    axios.post = async (endpoint, body, options) => {
      assert.equal(endpoint, 'https://discord.com/api/v10/channels/12345678901234567/messages')
      assert.equal(options.timeout, 10000)
      if (body.getBuffer) {
        const parts = body.getBuffer().toString('utf8').split('name="payload_json"\r\n\r\n')
        messages.push(JSON.parse(parts[1].split('\r\n--')[0]))
        throw { response: { status: 413 } }
      }
      messages.push(body); return { data: { id: 'sent' } }
    }
    const result = await sendMembershipCard({ client, channel, guildId: channel.guild.id, recipientId: '23456789012345678',
      embed: new EmbedBuilder().setDescription('Mensaje personalizado'), render: async () => png,
    })
    assert.equal(result.card, false)
    assert.equal(messages.length, 2)
    assert.equal(messages[0].nonce, messages[1].nonce)
    assert.equal(messages[0].enforce_nonce, true)
    assert.equal(messages[1].embeds[0].description, 'Mensaje personalizado')
    assert.deepEqual(messages[1].allowed_mentions, { parse: [], users: ['23456789012345678'] })
    assert.equal(fetches, 3)
  } finally { axios.post = original }
})

test('registered leave event delivers its configured message after a worker failure', async () => {
  const axios = require('axios'), originalPost = axios.post
  const pool = require('../handlers/card-pool').cardPool(), originalRender = pool.render
  const guild = { id: '34567890123456789', name: 'Fixture', memberCount: 42, members: { fetchMe: async () => ({}) } }
  const channel = { id: '12345678901234567', guild, permissionsFor: () => new PermissionsBitField(8n) }
  const member = { id: '23456789012345678', guild, user: { id: '23456789012345678', username: 'Obey', bot: false,
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png', toString: () => '<@23456789012345678>' } }
  const record = { language: 'es', embed: { color: '#ffffff', wrongcolor: '#e01e01', thumb: false },
    leave: { image: true, custom: 'no', dm: false, channel: channel.id, pb: false, msg: 'Gracias por visitarnos, {user}' } }
  const handlers = new Map(), invites = new Map(), messages = []
  const client = { token: 'fixture-only-token', on: (name, handler) => handlers.set(name, handler),
    settings: { get: (id, key) => key ? key.split('.').reduce((value, part) => value?.[part], record) : record },
    channels: { fetch: async () => channel }, la: { es: require('../languages/es.json') },
    invitesdb: { ensure: (key, value) => invites.set(key, value), get: key => invites.get(key), find: () => undefined },
    getFooter: () => ({ text: 'OBEY' }), user: { displayAvatarURL: () => member.user.displayAvatarURL() },
  }
  let delivered
  const done = new Promise(resolve => { delivered = resolve })
  try {
    pool.render = async () => { throw Error('worker failure') }
    axios.post = async (endpoint, body) => { messages.push(body); delivered(); return { data: { id: 'sent' } } }
    require('../handlers/leave')(client)
    await handlers.get('guildMemberRemove')(member)
    await Promise.race([done, new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Event did not deliver fallback')), 2000)
      done.then(() => { clearTimeout(timer); resolve() })
    })])
    assert.equal(messages.length, 1)
    assert.equal(messages[0].getBuffer, undefined)
    assert.equal(messages[0].embeds[0].description, 'Gracias por visitarnos, <@23456789012345678>')
    assert.equal(messages[0].embeds[0].image, undefined)
  } finally { axios.post = originalPost; pool.render = originalRender }
})

test('public delivery rejects a channel from another guild or a missing guild scope before rendering or posting', async () => {
  const axios = require('axios'), original = axios.post
  let sends = 0
  const channel = { id: '12345678901234567', guild: { id: '34567890123456789', members: { fetchMe: async () => ({}) } }, permissionsFor: () => new PermissionsBitField(8n) }
  try {
    axios.post = async () => { sends++; return { data: { id: 'sent' } } }
    for (const guildId of ['45678901234567890', undefined]) {
      await assert.rejects(sendMembershipCard({ client: { token: 'fixture-only-token' }, channel, guildId,
        embed: new EmbedBuilder().setDescription('Private guild message'), render: async () => png,
      }), error => error.code === 'card_delivery_denied')
    }
    assert.equal(sends, 0)
  } finally { axios.post = original }
})
