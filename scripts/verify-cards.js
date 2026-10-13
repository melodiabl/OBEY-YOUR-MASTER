// Offline evidence from the production renderers. No Discord login or network media.
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { renderWelcomeCard, renderLeaveCard } = require('../handlers/cards')
const output = path.resolve(__dirname, '../docs/platform/evidence/cards')

async function main() {
  await fs.mkdir(output, { recursive: true })
  const avatar = createCanvas(600, 400), ctx = avatar.getContext('2d')
  ctx.fillStyle = '#eb4050'; ctx.fillRect(0, 0, 600, 400)
  ctx.fillStyle = '#23d1a1'; ctx.fillRect(100, 0, 400, 400)
  ctx.fillStyle = '#102330'; ctx.beginPath(); ctx.arc(300, 160, 85, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('OBEY', 300, 320)
  const avatarBuffer = await avatar.encode('png')
  const transparent = createCanvas(400, 400), transparentCtx = transparent.getContext('2d')
  transparentCtx.fillStyle = '#23d1a1'; transparentCtx.beginPath(); transparentCtx.arc(200, 200, 140, 0, Math.PI * 2); transparentCtx.fill()
  const transparentBuffer = await transparent.encode('png')
  const base = { data: { username: 'Obey Master', discriminator: '0', guildName: 'Comunidad OBEY', memberCount: 128 },
    avatarBuffer, accentColor: '#3A98F0',
    showAvatar: true, showServerName: true, showMemberCount: true, isLeave: false,
  }
  const cases = [
    ['welcome-frame', renderWelcomeCard, { frameColor: '#3A98F0' }],
    ['welcome-transparent-avatar', renderWelcomeCard, { frameColor: '#3A98F0', avatarBuffer: transparentBuffer }],
    ['welcome-without-avatar', renderWelcomeCard, { frameColor: 'WHITE', showAvatar: false }],
    ['welcome-long-name', renderWelcomeCard, { frameColor: '#3A98F0', data: { ...base.data, username: 'Obey 👨‍👩‍👧‍👦 comunidad '.repeat(12), guildName: 'Servidor con un nombre muy largo 日本語 '.repeat(5) } }],
    ['welcome-without-frame', renderWelcomeCard, {}],
    ['leave-texture', renderLeaveCard, { isLeave: true }],
    ['leave-without-texture', renderLeaveCard, { isLeave: true, noiseIntensity: 0 }],
    ['leave-invalid-images', renderLeaveCard, { isLeave: true, backgroundBuffer: Buffer.from('invalid'), avatarBuffer: Buffer.from('invalid') }],
  ]
  const results = []
  for (const [name, render, overrides] of cases) {
    const buffer = await render({ ...base, ...overrides })
    assert.ok(buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    const image = await loadImage(buffer), decoded = createCanvas(image.width, image.height), imageCtx = decoded.getContext('2d')
    imageCtx.drawImage(image, 0, 0)
    assert.equal(image.width, 1772)
    assert.equal(image.height, overrides.frameColor ? 633 : 720)
    assert.equal(imageCtx.getImageData(1400, 600, 1, 1).data[3], 255)
    await fs.writeFile(path.join(output, name + '.png'), buffer)
    results.push({ name, width: image.width, height: image.height, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') })
  }
  const report = { source: 'handlers/cards.js', offline: true, published: false, fixtures: 'Local synthetic avatars; no user media or guild data', cases: results }
  await fs.writeFile(path.join(output, 'renders.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
