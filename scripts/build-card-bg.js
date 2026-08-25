// Genera los FONDOS ESTÁTICOS de las tarjetas (gradientes/glows/sparkles) como PNG,
// para que el bot solo dibuje lo dinámico (avatar/texto/barras) encima en cada render.
// Ejecutar tras cambiar un diseño:  node scripts/build-card-bg.js
const Canvas = require('@napi-rs/canvas')
const fs = require('fs')
const path = require('path')
const { drawWaveAccents, drawSparkles } = require(path.join(process.cwd(), 'handlers/canvasUtils'))

const ACCENT = '#5865F2'
const OUT = path.join(process.cwd(), 'assets/cards')
fs.mkdirSync(OUT, { recursive: true })
const save = (n, c) => { fs.writeFileSync(path.join(OUT, n), c.toBuffer('image/png')); console.log('✓ assets/cards/' + n) }
function rrFill(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

// ── LEVEL-UP bg (1802×430): gradiente + glow + overlay + waves + sparkles ──
;(function levelup() {
  const W = 1802, H = 430
  const c = Canvas.createCanvas(W, H), ctx = c.getContext('2d')
  const grd = ctx.createLinearGradient(0, 0, W, H); grd.addColorStop(0, '#171232'); grd.addColorStop(1, '#0a0a14')
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H)
  const ag = ctx.createRadialGradient(227, 215, 20, 227, 215, 620)
  ag.addColorStop(0, 'rgba(88,101,242,0.40)'); ag.addColorStop(1, 'transparent')
  ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H)
  const ro = ctx.createLinearGradient(380, 0, W, 0)
  ro.addColorStop(0, 'rgba(0,0,0,0)'); ro.addColorStop(0.3, 'rgba(0,0,0,0.42)'); ro.addColorStop(1, 'rgba(0,0,0,0.52)')
  ctx.fillStyle = ro; ctx.fillRect(0, 0, W, H)
  drawWaveAccents(ctx, W, H, ACCENT)
  drawSparkles(ctx, W, H, ACCENT)
  save('levelup-bg.png', c)
})()

// ── LEADERBOARD bg (830×1030): gradiente + glow superior ──
;(function leaderboard() {
  const W = 830, H = 1030
  const c = Canvas.createCanvas(W, H), ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#171232'); g.addColorStop(1, '#0a0a14')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const rg = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, 500)
  rg.addColorStop(0, 'rgba(88,101,242,.45)'); rg.addColorStop(1, 'rgba(88,101,242,0)')
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 300)
  save('leaderboard-bg.png', c)
})()

// ── RANK CARD bg (3768×2144): base plana + divisor (estático) ──
;(function rank() {
  const W = 3768, H = 2144
  const c = Canvas.createCanvas(W, H), ctx = c.getContext('2d')
  ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(1200, 980); ctx.lineTo(W - 250, 980); ctx.stroke()
  save('rank-bg.png', c)
})()

console.log('Listo.')
