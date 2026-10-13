const test = require('node:test')
const assert = require('node:assert/strict')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { drawNoise, drawCircularAvatar, renderLeaveCard, renderWelcomeCard, renderConfiguredWelcomeCard, fitCardText } = require('../handlers/cards')

const pixel = (ctx, x, y) => [...ctx.getImageData(x, y, 1, 1).data]

test('noise preserves opaque content and rounded transparency; zero intensity preserves bytes', () => {
  const canvas = createCanvas(100, 100), ctx = canvas.getContext('2d')
  ctx.save(); ctx.beginPath(); ctx.arc(50, 50, 40, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 100, 100)
  const before = Buffer.from(ctx.getImageData(0, 0, 100, 100).data)
  drawNoise(ctx, 100, 100, 0)
  assert.ok(Buffer.from(ctx.getImageData(0, 0, 100, 100).data).equals(before), 'Zero intensity preserves all pixels')
  drawNoise(ctx, 100, 100, 6)
  assert.equal(pixel(ctx, 50, 50)[3], 255)
  assert.ok(pixel(ctx, 50, 50).slice(0, 3).every(value => value >= 249))
  assert.equal(pixel(ctx, 0, 0)[3], 0)
  ctx.restore()
  assert.equal(ctx.globalAlpha, 1)
})

test('rectangular avatars crop to the centre and remain inside a circle', async () => {
  const source = createCanvas(120, 40), sourceCtx = source.getContext('2d')
  sourceCtx.fillStyle = '#ff0000'; sourceCtx.fillRect(0, 0, 120, 40)
  sourceCtx.fillStyle = '#00ff00'; sourceCtx.fillRect(40, 0, 40, 40)
  const output = createCanvas(80, 80), ctx = output.getContext('2d')
  drawCircularAvatar(ctx, await loadImage(await source.encode('png')), 10, 10, 60)
  assert.deepEqual(pixel(ctx, 40, 40), [0, 255, 0, 255])
  assert.deepEqual(pixel(ctx, 40, 15), [0, 255, 0, 255])
  assert.equal(pixel(ctx, 11, 11)[3], 0)
  ctx.fillStyle = '#0000ff'; ctx.fillRect(0, 0, 1, 1)
  assert.deepEqual(pixel(ctx, 0, 0), [0, 0, 255, 255])
})

test('leave PNG keeps its avatar, text and background after the final texture', async () => {
  const avatar = createCanvas(120, 40), ctx = avatar.getContext('2d')
  ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 120, 40)
  ctx.fillStyle = '#00ff00'; ctx.fillRect(40, 0, 40, 40)
  const buffer = await renderLeaveCard({
    member: { user: { username: 'Obey', discriminator: '0', displayAvatarURL: () => avatar.toBuffer('image/png') } },
    guild: { name: 'Servidor', memberCount: 42 }, accentColor: '#5865F2',
    showAvatar: true, showMemberCount: true, showServerName: true, isLeave: true,
  })
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10])
  const image = await loadImage(buffer), output = createCanvas(image.width, image.height), out = output.getContext('2d')
  out.drawImage(image, 0, 0)
  assert.deepEqual([image.width, image.height], [1772, 720])
  const centre = pixel(out, 237, 360)
  assert.equal(centre[3], 255)
  assert.ok(centre[1] >= 249 && centre[0] <= 6 && centre[2] <= 6)
  assert.equal(pixel(out, 0, 0)[3], 0)
  const text = out.getImageData(379, 235, 300, 70).data
  let bright = 0
  for (let i = 0; i < text.length; i += 4) if (text[i] > 200 && text[i + 1] > 200 && text[i + 2] > 200 && text[i + 3] === 255) bright++
  assert.ok(bright > 100, 'Username remains legible after noise')
})

test('welcome respects disabled avatar/frame and shares the same settings for preview and event', async () => {
  let reads = 0
  const member = { user: { username: 'Obey', discriminator: '0', displayAvatarURL: () => { reads++; throw Error('Avatar should be disabled') } }, guild: { id: 'g', name: 'Guild', memberCount: 10 } }
  const values = { 'welcome.pb': false, 'welcome.frame': false, 'welcome.framecolor': 'white', 'welcome.membercount': true }
  const settings = { get: (id, key) => { assert.equal(id, 'g'); return values[key] } }
  const event = await renderConfiguredWelcomeCard(settings, member)
  const preview = await renderConfiguredWelcomeCard(settings, member)
  assert.ok(event.equals(preview), 'Same configuration produces exactly the same pixels')
  assert.equal((await loadImage(event)).height, 720)
  assert.equal(reads, 0)
  values['welcome.frame'] = true
  assert.equal((await loadImage(await renderConfiguredWelcomeCard(settings, member))).height, 633)
})

test('text fits its allocated width and truncates Unicode without splitting a character', () => {
  const ctx = createCanvas(500, 100).getContext('2d')
  const long = '👨‍👩‍👧‍👦 Nombre '.repeat(80)
  const fitted = fitCardText(ctx, long, 200, { maxSize: 60, minSize: 24, family: 'Arial' })
  assert.ok(fitted.width <= 200)
  assert.equal(fitted.fontSize, 24)
  assert.ok(fitted.text.endsWith('…'))
  assert.ok(!fitted.text.includes('\uFFFD'))
  assert.ok(!fitted.text.endsWith('\u200d…'))
  assert.equal(fitCardText(ctx, 'Obey', 200, { maxSize: 40, minSize: 24, family: 'Arial' }).text, 'Obey')
})

test('both slash previews return the exact configured event image', async () => {
  const axios = require('axios'), originalPatch = axios.patch
  const guild = { id: 'g', name: 'Guild', memberCount: 10 }
  const user = { id: 'actor', username: 'Obey', discriminator: '0' }, member = { user, guild }
  guild.members = { fetch: async () => member }
  const values = { welcome: { channel: 'chat' }, 'welcome.pb': false, 'welcome.frame': false, 'welcome.framecolor': 'white', 'welcome.membercount': true }
  const settings = { get: (id, key) => values[key] }
  const expected = await renderConfiguredWelcomeCard(settings, member)
  const client = { settings, user: { id: 'app' } }
  try {
    for (const name of ['tarjeta', 'test']) {
      let sent = 0, deferred = 0
      axios.patch = async (url, form) => { assert.ok(form.getBuffer().includes(expected)); sent++; return {} }
      const interaction = { guild, user, options: { getUser: () => null }, token: 'fixture-token',
        deferReply: async () => { deferred++ }, editReply: async payload => { assert.fail(JSON.stringify(payload)) },
      }
      await require(`../slashCommands/Welcome/${name}`).run(client, interaction)
      assert.equal(deferred, 1); assert.equal(sent, 1)
    }
  } finally { axios.patch = originalPatch }
})

test('failed optional images keep a readable neutral background', async () => {
  const options = { member: { user: { username: 'Obey', displayAvatarURL: () => Buffer.from('invalid image') } },
    guild: { name: 'Guild', memberCount: 10 }, showAvatar: true, showServerName: true,
    background: Buffer.from('invalid image'), accentColor: '#5865F2', isLeave: true,
  }
  for (const render of [renderWelcomeCard, renderLeaveCard]) {
    const image = await loadImage(await render(options)), canvas = createCanvas(image.width, image.height), ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    assert.equal(pixel(ctx, 1400, 360)[3], 255, 'Fallback background remains opaque')
  }
})

test('transparent avatars keep their alpha without a rectangular matte', async () => {
  const source = createCanvas(100, 100), src = source.getContext('2d')
  src.fillStyle = '#ff0000'; src.fillRect(45, 45, 10, 10)
  const target = createCanvas(100, 100), ctx = target.getContext('2d')
  drawCircularAvatar(ctx, await loadImage(await source.encode('png')), 0, 0, 100)
  assert.equal(pixel(ctx, 50, 10)[3], 0)
  assert.deepEqual(pixel(ctx, 50, 50), [255, 0, 0, 255])
})

test('modern emoji has a visible glyph instead of the missing-character box', () => {
  function pixels(text) {
    const canvas = createCanvas(160, 120), ctx = canvas.getContext('2d')
    fitCardText(ctx, text, 150, { maxSize: 70, minSize: 70, family: 'Genta' })
    ctx.fillStyle = '#ffffff'; ctx.fillText(text, 10, 85)
    return Buffer.from(ctx.getImageData(0, 0, 160, 120).data)
  }
  assert.ok(!pixels('🐱').equals(pixels('\u{10ffff}')), 'Emoji must differ from the missing glyph')
})
