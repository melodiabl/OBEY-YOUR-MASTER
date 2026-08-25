// Shared canvas design system — used by ranking.js, welcome.js, leave.js, tarjeta.js
const Canvas = require('@napi-rs/canvas')
const path   = require('path')

const BASE_PNG = path.join(process.cwd(), 'assets', 'base.png')
const BOT_PNG  = path.join(process.cwd(), 'assets', 'bot.png')

function rgba(hex, a) {
  const h = (hex === 'WHITE' ? '#FFFFF9' : String(hex || '#5865F2')).replace('#', '')
  const r = parseInt(h.slice(0,2), 16), g = parseInt(h.slice(2,4), 16), b = parseInt(h.slice(4,6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function glow(ctx, x, y, r, fc, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgba(fc, a)); g.addColorStop(0.5, rgba(fc, a*0.3)); g.addColorStop(1, 'transparent')
  ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2)
}

function drawStar(ctx, cx, cy, outer, inner, fc, alpha) {
  ctx.save(); ctx.fillStyle = rgba(fc, alpha)
  ctx.beginPath()
  ctx.moveTo(cx, cy - outer); ctx.lineTo(cx + inner, cy - inner)
  ctx.lineTo(cx + outer, cy); ctx.lineTo(cx + inner, cy + inner)
  ctx.lineTo(cx, cy + outer); ctx.lineTo(cx - inner, cy + inner)
  ctx.lineTo(cx - outer, cy); ctx.lineTo(cx - inner, cy - inner)
  ctx.closePath(); ctx.fill(); ctx.restore()
}

// Bezier wave accents at top-left and bottom-right corners
function drawWaveAccents(ctx, W, H, fc) {
  ctx.save()
  // Top-left — 3 wave layers
  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.55)
  ctx.moveTo(0, H*0.34)
  ctx.bezierCurveTo(W*0.032, H*0.28, W*0.081, H*0.26, W*0.121, H*0.22)
  ctx.bezierCurveTo(W*0.165, H*0.18, W*0.200, H*0.115, W*0.232, H*0.043)
  ctx.lineTo(W*0.250, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill()

  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.28)
  ctx.moveTo(0, H*0.50)
  ctx.bezierCurveTo(W*0.006, H*0.475, W*0.014, H*0.449, W*0.024, H*0.426)
  ctx.bezierCurveTo(W*0.056, H*0.354, W*0.107, H*0.336, W*0.150, H*0.295)
  ctx.bezierCurveTo(W*0.194, H*0.254, W*0.228, H*0.189, W*0.261, H*0.116)
  ctx.bezierCurveTo(W*0.279, H*0.080, W*0.309, H*0.003, W*0.309, 0)
  ctx.lineTo(0, 0); ctx.closePath(); ctx.fill()

  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.08)
  ctx.moveTo(0, H*0.83); ctx.lineTo(0, H*0.777)
  ctx.bezierCurveTo(W*0.008, H*0.708, W*0.018, H*0.572, W*0.050, H*0.498)
  ctx.bezierCurveTo(W*0.081, H*0.425, W*0.135, H*0.413, W*0.180, H*0.374)
  ctx.bezierCurveTo(W*0.224, H*0.336, W*0.259, H*0.272, W*0.291, H*0.197)
  ctx.bezierCurveTo(W*0.322, H*0.124, W*0.351, H*0.042, W*0.365, 0)
  ctx.lineTo(0, 0); ctx.closePath(); ctx.fill()

  // Bottom-right — 3 wave layers (mirrored)
  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.55)
  ctx.moveTo(W, 0); ctx.lineTo(W*0.822, 0)
  ctx.bezierCurveTo(W*0.853, H*0.091, W*0.883, H*0.183, W*0.920, H*0.258)
  ctx.bezierCurveTo(W*0.936, H*0.286, W*0.988, H*0.348, W, H*0.360)
  ctx.closePath(); ctx.fill()

  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.28)
  ctx.moveTo(W, 0); ctx.lineTo(W*0.769, 0)
  ctx.bezierCurveTo(W*0.820, H*0.085, W*0.851, H*0.177, W*0.892, H*0.252)
  ctx.bezierCurveTo(W*0.904, H*0.273, W*0.917, H*0.295, W*0.930, H*0.312)
  ctx.bezierCurveTo(W*0.956, H*0.347, W*0.980, H*0.378, W, H*0.415)
  ctx.closePath(); ctx.fill()

  ctx.beginPath(); ctx.fillStyle = rgba(fc, 0.08)
  ctx.moveTo(W, 0); ctx.lineTo(W*0.714, 0)
  ctx.bezierCurveTo(W*0.727, H*0.051, W*0.742, H*0.097, W*0.758, H*0.150)
  ctx.bezierCurveTo(W*0.785, H*0.244, W*0.817, H*0.304, W*0.859, H*0.361)
  ctx.bezierCurveTo(W*0.872, H*0.379, W*0.885, H*0.395, W*0.899, H*0.410)
  ctx.bezierCurveTo(W*0.930, H*0.444, W*0.962, H*0.472, W, H*0.489)
  ctx.closePath(); ctx.fill()

  ctx.restore()
}

// Scattered 4-point star sparkles (proportional to canvas)
function drawSparkles(ctx, W, H, fc) {
  const S = [
    [0.320, 0.085, 12, 4, 0.75], [0.880, 0.114, 10, 3, 0.45],
    [0.370, 0.600, 14, 5, 0.85], [0.730, 0.543, 11, 4, 0.32],
    [0.970, 0.629,  8, 3, 0.55], [0.550, 0.314, 20, 7, 0.14],
    [0.180, 0.657,  6, 2, 0.65], [0.460, 0.086,  9, 3, 0.22],
  ]
  for (const [xr, yr, o, i, a] of S) drawStar(ctx, W*xr, H*yr, o, i, fc, a)
  ctx.save()
  const D = [[0.370,0.40,2.5,0.28],[0.220,0.171,2.0,0.45],[0.710,0.143,2.0,0.38],
             [0.900,0.286,2.0,0.42],[0.800,0.800,2.5,0.35],[0.500,0.571,2.0,0.28]]
  for (const [xr, yr, r, a] of D) {
    ctx.beginPath(); ctx.arc(W*xr, H*yr, r, 0, Math.PI*2)
    ctx.fillStyle = rgba(fc, a); ctx.fill()
  }
  ctx.restore()
}

// Clip entire canvas to rounded rectangle
function clipRounded(ctx, W, H, R = 24) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(R, 0); ctx.lineTo(W-R, 0); ctx.arcTo(W, 0, W, R, R)
  ctx.lineTo(W, H-R); ctx.arcTo(W, H, W-R, H, R)
  ctx.lineTo(R, H); ctx.arcTo(0, H, 0, H-R, R)
  ctx.lineTo(0, R); ctx.arcTo(0, 0, R, 0, R)
  ctx.closePath(); ctx.clip()
}

// Full dark background: base.png texture + overlay + waves + sparkles
// opts: { fc, userBannerUrl, customBg }
async function drawCardBg(ctx, W, H, opts = {}) {
  const { fc = '#5865F2', userBannerUrl, customBg } = opts

  if (customBg && customBg !== 'transparent') {
    try { ctx.drawImage(await Canvas.loadImage(customBg), 0, 0, W, H) } catch {}
    return
  }

  // base.png as subtle texture
  try {
    const base = await Canvas.loadImage(BASE_PNG)
    const scale = Math.max(W / base.width, H / base.height)
    const dW = base.width * scale, dH = base.height * scale
    ctx.save(); ctx.globalAlpha = 0.20
    ctx.drawImage(base, (W-dW)/2, (H-dH)/2, dW, dH)
    ctx.globalAlpha = 1; ctx.restore()
  } catch {}

  // Dark overlay
  const dark = ctx.createLinearGradient(0, 0, W, H)
  dark.addColorStop(0, 'rgba(4,6,16,0.91)')
  dark.addColorStop(0.5, 'rgba(7,9,22,0.85)')
  dark.addColorStop(1, 'rgba(4,6,16,0.91)')
  ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H)

  // Wave corner accents
  drawWaveAccents(ctx, W, H, fc)

  // Ambient glows
  glow(ctx, W*0.18, H*0.50, W*0.28, fc, 0.18)
  glow(ctx, W*0.85, H*0.15, W*0.17, fc, 0.09)
  glow(ctx, W*0.92, H*0.85, W*0.14, fc, 0.07)
  glow(ctx, W*0.50, H*0.50, W*0.17, '#5865F2', 0.04)

  // Optional user banner (Nitro)
  if (userBannerUrl) {
    try {
      const banner = await Canvas.loadImage(userBannerUrl)
      const scale = Math.max(W / banner.width, H / banner.height)
      const dW = banner.width * scale, dH = banner.height * scale
      ctx.save(); ctx.globalAlpha = 0.16
      ctx.drawImage(banner, (W-dW)/2, (H-dH)/2, dW, dH)
      ctx.globalAlpha = 1; ctx.restore()
    } catch {}
  }

  // Sparkles
  drawSparkles(ctx, W, H, fc)
}

// Avatar with gradient ring + optional status cut-out (discord-card-canvas technique)
async function drawAvatarWithRing(ctx, avatarImg, cx, cy, radius, fc, presence) {
  const statusColors = { online: '#57F287', idle: '#FEE75C', dnd: '#ED4245', streaming: '#593695' }
  const sColor = statusColors[presence] || null

  // Ambient halo
  glow(ctx, cx, cy, radius * 2.0, fc, 0.24)
  glow(ctx, cx, cy, radius * 1.3, fc, 0.14)

  // Outer thin ring
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, radius + 16, 0, Math.PI*2); ctx.closePath()
  ctx.strokeStyle = rgba(fc, 0.20); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  // Gradient ring
  const ring = ctx.createLinearGradient(cx-radius, cy-radius, cx+radius, cy+radius)
  ring.addColorStop(0, fc === 'WHITE' ? '#FFFFF9' : fc.toLowerCase())
  ring.addColorStop(0.3, rgba(fc, 0.60))
  ring.addColorStop(0.7, fc === 'WHITE' ? '#FFFFF9' : fc.toLowerCase())
  ring.addColorStop(1, rgba(fc, 0.55))
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, radius + 10, 0, Math.PI*2); ctx.closePath()
  ctx.fillStyle = ring; ctx.fill(); ctx.restore()

  // Dark gap
  ctx.save()
  ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI*2); ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,0.52)'; ctx.fill(); ctx.restore()

  // Avatar clip with optional status cut-out
  ctx.save()
  ctx.beginPath()
  if (sColor) {
    const sx = cx + radius * 0.700, sy = cy + radius * 0.700
    ctx.arc(cx, cy, radius, 0, Math.PI*2)
    ctx.arc(sx, sy, radius * 0.092, 0, Math.PI*2, true)
  } else {
    ctx.arc(cx, cy, radius, 0, Math.PI*2)
  }
  ctx.closePath(); ctx.clip()
  ctx.drawImage(avatarImg, cx-radius, cy-radius, radius*2, radius*2)
  // Bottom reflection
  const refl = ctx.createLinearGradient(cx, cy, cx, cy+radius)
  refl.addColorStop(0, 'transparent'); refl.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = refl; ctx.fillRect(cx-radius, cy, radius*2, radius)
  ctx.restore()

  // Status dot
  if (sColor) {
    const sx = cx + radius * 0.700, sy = cy + radius * 0.700
    const dotR = radius * 0.092
    ctx.save()
    ctx.beginPath(); ctx.arc(sx, sy, dotR + 3, 0, Math.PI*2)
    ctx.fillStyle = '#111'; ctx.fill()
    ctx.beginPath(); ctx.arc(sx, sy, dotR, 0, Math.PI*2)
    ctx.fillStyle = sColor; ctx.fill()
    ctx.restore()
  }
}

// Small bot.png watermark bottom-right
async function drawWatermark(ctx, W, H) {
  try {
    const bot = await Canvas.loadImage(BOT_PNG)
    ctx.save(); ctx.globalAlpha = 0.22
    ctx.drawImage(bot, W - Math.round(W*0.056), H - Math.round(H*0.093), Math.round(W*0.047), Math.round(H*0.084))
    ctx.restore()
  } catch {}
}

module.exports = { rgba, glow, drawStar, drawWaveAccents, drawSparkles, clipRounded, drawCardBg, drawAvatarWithRing, drawWatermark }
