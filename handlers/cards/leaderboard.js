// Leaderboard · GLASS · 830×1030 vertical (diseño elegido 2026-06-20)
const Canvas = require('@napi-rs/canvas')

const F = `${process.cwd()}/assets/fonts`
try {
  Canvas.GlobalFonts.registerFromPath(`${F}/DMSans-Bold.ttf`, 'DM Sans')
  Canvas.GlobalFonts.registerFromPath(`${F}/DMSans-Regular.ttf`, 'DM Sans')
} catch {}

const P = '#5865F2', P2 = '#7c8cff', WHITE = '#ffffff', MUT = '#b3b5c9'
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
const nfmt = n => Number(n || 0).toLocaleString('es-ES')

// Fondo estático pre-renderizado (assets/cards/leaderboard-bg.png), cargado una sola vez.
let _bg = null
async function bg() {
  if (_bg === null) { try { _bg = await Canvas.loadImage(`${process.cwd()}/assets/cards/leaderboard-bg.png`) } catch { _bg = false } }
  return _bg
}

// rows = [{ name, avatar, value, offset }]   offset = nº de la posición global (0-based)
module.exports = async function renderLeaderboard(rows, opts = {}) {
  const W = 830, H = 1030
  const c = Canvas.createCanvas(W, H), ctx = c.getContext('2d')
  rr(ctx, 0, 0, W, H, 30); ctx.clip()
  const bgImg = await bg()
  if (bgImg) ctx.drawImage(bgImg, 0, 0, W, H)
  else {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#171232'); g.addColorStop(1, '#0a0a14')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const rg = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 0, 500)
    rg.addColorStop(0, 'rgba(88,101,242,.45)'); rg.addColorStop(1, 'rgba(88,101,242,0)')
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 300)
  }

  ctx.fillStyle = P2; ctx.font = 'bold 26px "DM Sans"'; ctx.fillText((opts.kicker || 'LEADERBOARD').toUpperCase(), 40, 70)
  ctx.fillStyle = WHITE; ctx.font = 'bold 58px "DM Sans"'; ctx.fillText(opts.title || 'Top del servidor', 40, 130)

  const list = rows.slice(0, 10)
  const MAX = Math.max(1, ...list.map(r => Number(r.value) || 0))
  const TOP = 170, GAP = 8
  const RH = Math.min(96, Math.floor((H - TOP - 26) / Math.max(1, list.length)) - GAP)

  // pre-cargar avatares
  const imgs = await Promise.all(list.map(r => Canvas.loadImage(r.avatar).catch(() => null)))

  list.forEach((r, idx) => {
    const pos = (r.offset ?? idx)            // posición global 0-based
    const y = TOP + idx * (RH + GAP), top3 = pos < 3
    ctx.fillStyle = top3 ? 'rgba(88,101,242,.16)' : 'rgba(255,255,255,.045)'; rr(ctx, 40, y, W - 80, RH, 18); ctx.fill()
    if (top3) { ctx.strokeStyle = 'rgba(124,140,255,.5)'; ctx.lineWidth = 1.5; rr(ctx, 40, y, W - 80, RH, 18); ctx.stroke() }
    ctx.fillStyle = top3 ? P2 : MUT; ctx.font = 'bold 42px "DM Sans"'; ctx.textAlign = 'center'
    ctx.fillText('#' + (pos + 1), 95, y + RH / 2 + 15); ctx.textAlign = 'left'
    // avatar
    ctx.save(); ctx.beginPath(); ctx.arc(175, y + RH / 2, 34, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
    ctx.fillStyle = '#242433'; ctx.fillRect(141, y + RH / 2 - 34, 68, 68)
    if (imgs[idx]) ctx.drawImage(imgs[idx], 141, y + RH / 2 - 34, 68, 68); ctx.restore()
    // nombre (recortado)
    let name = String(r.name || '?')
    ctx.fillStyle = WHITE; ctx.font = 'bold 34px "DM Sans"'
    while (ctx.measureText(name).width > 300 && name.length > 2) name = name.slice(0, -1)
    if (name !== String(r.name || '')) name += '…'
    ctx.fillText(name, 230, y + RH / 2 + 12)
    // barra + valor
    const bw = 180, bx = W - 80 - bw - 130
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, bx, y + RH / 2 - 7, bw, 14, 7); ctx.fill()
    const bg2 = ctx.createLinearGradient(bx, 0, bx + bw, 0); bg2.addColorStop(0, P); bg2.addColorStop(1, P2)
    ctx.fillStyle = bg2; rr(ctx, bx, y + RH / 2 - 7, bw * ((Number(r.value) || 0) / MAX), 14, 7); ctx.fill()
    ctx.fillStyle = WHITE; ctx.font = 'bold 32px "DM Sans"'; ctx.textAlign = 'right'
    ctx.fillText(nfmt(r.value), W - 60, y + RH / 2 + 12); ctx.textAlign = 'left'
  })
  return c.toBuffer('image/webp')
}
