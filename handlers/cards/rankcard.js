// Rank Card · MINIMAL · 3768×2144 (diseño elegido 2026-06-20)
// Dibuja stats de Texto y Voz con nivel, rank y barra XP cada uno.
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

// Fondo estático pre-renderizado (assets/cards/rank-bg.png), cargado una sola vez.
let _bg = null
async function bg() {
  if (_bg === null) { try { _bg = await Canvas.loadImage(`${process.cwd()}/assets/cards/rank-bg.png`) } catch { _bg = false } }
  return _bg
}

// xp = { avatar, username, text:{cur_level,rank,percent,current,needed}, voice:{...} }
module.exports = async function renderRankCard(xp) {
  const W = 3768, H = 2144
  const c = Canvas.createCanvas(W, H), ctx = c.getContext('2d')
  rr(ctx, 0, 0, W, H, 70); ctx.clip()
  const bgImg = await bg()
  if (bgImg) ctx.drawImage(bgImg, 0, 0, W, H)
  else {
    ctx.fillStyle = '#101018'; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(1200, 980); ctx.lineTo(W - 250, 980); ctx.stroke()
  }

  // Avatar
  ctx.beginPath(); ctx.arc(640, 800, 420, 0, Math.PI * 2); ctx.strokeStyle = P; ctx.lineWidth = 12; ctx.stroke()
  ctx.save(); ctx.beginPath(); ctx.arc(640, 800, 400, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
  ctx.fillStyle = '#242433'; ctx.fillRect(220, 380, 840, 840)
  try { const av = await Canvas.loadImage(xp.avatar); ctx.drawImage(av, 240, 400, 800, 800) } catch {}
  ctx.restore()

  // Nombre + usuario (recorta si es muy largo)
  let name = String(xp.username || 'Usuario')
  ctx.fillStyle = WHITE; ctx.font = 'bold 210px "DM Sans"'
  while (ctx.measureText(name).width > 2350 && name.length > 3) name = name.slice(0, -1)
  if (name !== String(xp.username || '')) name += '…'
  ctx.fillText(name, 1200, 700)
  ctx.fillStyle = MUT; ctx.font = '100px "DM Sans"'; ctx.fillText('Perfil de rango', 1206, 850)

  const col = (x, label, s) => {
    const pct = Math.max(0, Math.min(1, (Number(s.percent) || 0) / 100))
    ctx.fillStyle = P; ctx.font = 'bold 80px "DM Sans"'; ctx.fillText(label, x, 1230)
    ctx.fillStyle = WHITE; ctx.font = 'bold 320px "DM Sans"'; ctx.fillText('Nv ' + (s.cur_level ?? 0), x, 1560)
    ctx.fillStyle = P2; ctx.font = '95px "DM Sans"'; ctx.fillText('Rank #' + (s.rank ?? '—'), x, 1700)
    const bw = 1180
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, x, 1800, bw, 48, 24); ctx.fill()
    ctx.fillStyle = P; rr(ctx, x, 1800, Math.max(48, bw * pct), 48, 24); ctx.fill()
    ctx.fillStyle = MUT; ctx.font = '70px "DM Sans"'; ctx.fillText(`${nfmt(s.current)} / ${nfmt(s.needed)} XP`, x, 1940)
  }
  col(1200, 'TEXTO', xp.text || {})
  col(2480, 'VOZ', xp.voice || {})

  return c.toBuffer('image/webp')
}
