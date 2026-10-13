const Canvas = require('@napi-rs/canvas')
const path = require('node:path')
const { clipRounded, drawCardBg } = require('./canvasUtils')
const { inspectCardImage } = require('./card-media')
for (const [file, family] of [['DMSans-Bold.ttf', 'DM Sans'], ['Genta.ttf', 'Genta'], ['STIXGeneral.ttf', 'STIXGeneral'], ['UbuntuMono.ttf', 'UbuntuMono'], ['Arial.ttf', 'Arial'], ['ArialUnicode.ttf', 'ObeyUnicode'], ['AppleSymbol.ttf', 'ObeySymbols'], ['NotoEmoji.ttf', 'ObeyEmoji']]) {
  Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts', file), family)
}
const Fonts = 'Genta, UbuntuMono, "DM Sans", STIXGeneral, Arial'
const wideFonts = '"DM Sans", STIXGeneral, Arial'
const WELCOME_ASSETS = path.join(__dirname, '../assets/welcome')
const FRAME_COLORS = ['#030303', '#25FA6C', '#3A98F0', '#8525FA', '#FA2525', '#FA9E25', '#FAFA25', '#FFFFF9', 'WHITE']
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function fitCardText(ctx, raw, width, { maxSize, minSize, family }) {
  const parts = []
  let length = 0, capped = false
  for (const part of graphemes.segment(String(raw ?? ''))) {
    if (length + part.segment.length > 2048) { capped = true; break }
    parts.push(part.segment); length += part.segment.length
  }
  let text = parts.join('') + (capped ? '…' : ''), fontSize = maxSize
  const setFont = () => { ctx.font = `${fontSize}px ${family}, ObeyUnicode, ObeySymbols, ObeyEmoji` }
  setFont()
  while (ctx.measureText(text).width > width && fontSize > minSize) { fontSize--; setFont() }
  if (ctx.measureText(text).width > width) {
    let low = 0, high = parts.length
    while (low < high) {
      const middle = Math.ceil((low + high) / 2)
      if (ctx.measureText(parts.slice(0, middle).join('') + '…').width <= width) low = middle
      else high = middle - 1
    }
    text = parts.slice(0, low).join('') + '…'
  }
  return { text, fontSize, width: ctx.measureText(text).width }
}

function normalizedCardData(data = {}) {
  const text = (value, fallback) => typeof value === 'string' ? value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ') : fallback
  return { username: text(data.username, 'Miembro'), discriminator: text(data.discriminator, '0'),
    guildName: text(data.guildName, 'Tu comunidad'), memberCount: Number.isSafeInteger(data.memberCount) && data.memberCount >= 0 ? data.memberCount : 0 }
}
function safeRasterBuffer(buffer) {
  try { inspectCardImage(buffer); return buffer } catch { return null }
}
function drawCircularAvatar(ctx, image, x, y, size) {
  const crop = Math.min(image.width, image.height)
  ctx.save()
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip()
  ctx.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, x, y, size, size)
  ctx.restore()
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function _hexRgba(h, a) {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
// A single small tile bounds memory and gives event/preview renders the same grain.
let noiseTile
function drawNoise(ctx, w, h, intensity = 6) {
  const alpha = Math.min(255, Math.max(0, Number(intensity))) / 255
  if (!Number.isFinite(alpha) || alpha === 0) return
  if (!noiseTile) {
    noiseTile = Canvas.createCanvas(128, 128)
    const tileCtx = noiseTile.getContext('2d'), pixels = tileCtx.createImageData(128, 128)
    let seed = 0x0be12345
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
      const value = seed & 255
      pixels.data[i] = value; pixels.data[i + 1] = value; pixels.data[i + 2] = value; pixels.data[i + 3] = 255
    }
    tileCtx.putImageData(pixels, 0, 0)
  }
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha *= alpha
  ctx.fillStyle = ctx.createPattern(noiseTile, 'repeat')
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}
async function renderLeaveCard({ data, avatarBuffer, backgroundBuffer, accentColor, showAvatar, showDiscriminator, showMemberCount, showServerName, isLeave, noiseIntensity = 6 }) {
  data = normalizedCardData(data)
  const canvas = Canvas.createCanvas(1772, 720), ctx = canvas.getContext("2d");
  const W = 1772, H = 720, ACCENT = accentColor || "#5865F2";
  clipRounded(ctx, W, H, 28)
  await drawCardBg(ctx, W, H, { fc: ACCENT, customBg: safeRasterBuffer(backgroundBuffer), texture: false })
  const cx = 80, cy = 110, cw = 930, ch = 500, cr = 36;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 80; ctx.shadowOffsetY = 20;
  _roundRect(ctx, cx, cy, cw, ch, cr);
  const gg = ctx.createRadialGradient(cx + 100, cy, 0, cx + cw / 2, cy + ch / 2, cw);
  gg.addColorStop(0, _hexRgba(ACCENT, 0.06)); gg.addColorStop(0.5, "rgba(16,16,40,0.85)"); gg.addColorStop(1, "rgba(8,8,24,0.92)");
  ctx.fillStyle = gg; ctx.fill(); ctx.restore();
  _roundRect(ctx, cx, cy, cw, ch, cr); ctx.fillStyle = _hexRgba(ACCENT, 0.03); ctx.fill();
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 20;
  const ga = ctx.createLinearGradient(cx + 12, cy + 40, cx + 12, cy + ch - 40);
  ga.addColorStop(0, ACCENT); ga.addColorStop(0.5, _hexRgba(ACCENT, 0.6)); ga.addColorStop(1, ACCENT);
  _roundRect(ctx, cx + 12, cy + 40, 5, ch - 80, 2.5); ctx.fillStyle = ga; ctx.fill(); ctx.restore();
  const asz = 194, ax = cx + 60, ay = cy + (ch - asz) / 2;
  if (showAvatar) { try {
    const av = await Canvas.loadImage(safeRasterBuffer(avatarBuffer));
    ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.6); ctx.shadowBlur = 40; ctx.shadowOffsetY = 5;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2 + 8, 0, Math.PI * 2); ctx.closePath();
    const rg = ctx.createLinearGradient(ax, ay, ax + asz, ay + asz);
    rg.addColorStop(0, ACCENT); rg.addColorStop(0.5, _hexRgba(ACCENT, 0.4)); rg.addColorStop(1, ACCENT);
    ctx.fillStyle = rg; ctx.fill(); ctx.restore();
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    drawCircularAvatar(ctx, av, ax, ay, asz); ctx.restore();
  } catch {} }
  const tx = cx + (showAvatar ? asz + 105 : 70), ty = cy + 180, mw = cw - (tx - cx) - 80;
  const name = fitCardText(ctx, data.username, mw, { maxSize: 56, minSize: 26, family: '"DM Sans", Arial, sans-serif' });
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#FFFFFF"; ctx.fillText(name.text, tx, ty); ctx.restore();
  const nw = name.width;
  if (showDiscriminator && data.discriminator && data.discriminator !== "0") {
    ctx.font = '28px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = "#9999AA"; ctx.fillText(`#${data.discriminator}`, tx + nw + 20, ty - 2);
  }
  const lY = ty + 45; ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 12;
  const ag = ctx.createLinearGradient(tx, lY, tx + 90, lY);
  ag.addColorStop(0, ACCENT); ag.addColorStop(0.6, _hexRgba(ACCENT, 0.5)); ag.addColorStop(1, "transparent");
  ctx.fillStyle = ag; ctx.fillRect(tx, lY, 90, 4); ctx.restore();
  let dY = lY + 55;
  if (showServerName) {
    ctx.font = '28px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = ACCENT;
    const msg = fitCardText(ctx, isLeave ? `Gracias por visitarnos, ${data.guildName}` : `Te damos la bienvenida a ${data.guildName}`, mw, { maxSize: 28, minSize: 28, family: '"DM Sans", Arial, sans-serif' });
    ctx.fillText(msg.text, tx, dY); dY += 48;
  }
  if (showMemberCount) {
    ctx.font = '20px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = "#8888AA";
    ctx.fillText(`Miembros actuales: ${data.memberCount}`, tx, dY);
  }
  const bx = cx + cw - 28, by = cy + 36;
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.3); ctx.shadowBlur = 20;
  _roundRect(ctx, bx - 134, by, 134, 46, 23); ctx.fillStyle = _hexRgba(ACCENT, 0.12); ctx.fill(); ctx.restore();
  ctx.save(); _roundRect(ctx, bx - 130, by + 2, 130, 42, 21); ctx.strokeStyle = _hexRgba(ACCENT, 0.25); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  ctx.font = 'bold 14px "DM Sans", "Arial", sans-serif'; ctx.fillStyle = ACCENT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(isLeave ? "HASTA PRONTO" : "NUEVO MIEMBRO", bx - 67, by + 23); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  drawNoise(ctx, W, H, noiseIntensity);
  return canvas.encode('png');
}

function _resolveFrameColor(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const up = raw.toUpperCase().trim();
  if (up === 'WHITE' || up === '#FFFFFF') return 'WHITE';
  if (FRAME_COLORS.includes(up)) return up;
  return null;
}

async function renderWelcomeCard({ data, avatarBuffer, backgroundBuffer, accentColor, showAvatar, showDiscriminator, showMemberCount, showServerName, isLeave, frameColor }) {
  data = normalizedCardData(data)
  const ACCENT = accentColor || "#5865F2";
  const resolvedFrame = _resolveFrameColor(frameColor);

  // \u2500\u2500 FRAME-BASED MODE (uses welcome PNG overlay assets) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  if (resolvedFrame) {
    const W = 1772, H = 633;
    const canvas = Canvas.createCanvas(W, H), ctx = canvas.getContext("2d");

    // Background
    clipRounded(ctx, W, H, 28)
    await drawCardBg(ctx, W, H, { fc: ACCENT, customBg: safeRasterBuffer(backgroundBuffer), texture: false })

    // Avatar BEFORE frame overlay (frame has transparent avatar slot)
    if (showAvatar) {
      try {
        const av = await Canvas.loadImage(safeRasterBuffer(avatarBuffer));
        // Subtle glow behind avatar
        ctx.save(); ctx.shadowColor = ACCENT + "80"; ctx.shadowBlur = 45;
        ctx.beginPath(); ctx.arc(65 + 250, 66 + 250, 252, 0, Math.PI * 2); ctx.closePath();
        ctx.fillStyle = "transparent"; ctx.fill(); ctx.restore();
        drawCircularAvatar(ctx, av, 65, 66, 500);
      } catch {}
    }

    // Frame PNG overlay (defines chrome/frame around content)
    const hasD = showDiscriminator && data.discriminator && data.discriminator !== "0";
    const hasS = showServerName;
    const fpName = hasD && hasS ? 'welcome3frame' : hasD ? 'welcome2frame_unten' : hasS ? 'welcome2frame_oben' : 'welcome1frame';
    try {
      ctx.drawImage(await Canvas.loadImage(path.join(WELCOME_ASSETS, resolvedFrame, `${fpName}.png`)), 0, 0, W, H);
      if (showAvatar) ctx.drawImage(await Canvas.loadImage(path.join(WELCOME_ASSETS, resolvedFrame, 'welcome1framepb.png')), 0, 0, W, H);
    } catch {}

    // Text (using accent/frame color so it matches the frame theme)
    ctx.fillStyle = resolvedFrame === 'WHITE' ? '#FFFFF9' : resolvedFrame.toLowerCase();
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    const uname = fitCardText(ctx, data.username, 1000, { maxSize: 150, minSize: 46, family: Fonts });
    ctx.fillText(uname.text, 720, 336);
    if (hasD) {
      ctx.font = `bold 40px ${wideFonts}`; ctx.fillStyle = "#999";
      ctx.fillText(`#${data.discriminator}`, 720, 390);
    }
    if (hasS) {
      const gname = fitCardText(ctx, data.guildName, 1000, { maxSize: 50, minSize: 24, family: wideFonts });
      ctx.fillStyle = resolvedFrame === 'WHITE' ? '#FFFFF9' : resolvedFrame.toLowerCase();
      ctx.fillText(gname.text, 700, 166);
    }
    if (showMemberCount) {
      ctx.font = `bold 46px ${wideFonts}`; ctx.fillStyle = resolvedFrame === 'WHITE' ? '#FFFFF9' : resolvedFrame.toLowerCase();
      ctx.fillText(`Miembros actuales: ${data.memberCount}`, 750, 516);
    }

    return canvas.encode('png');
  }

  // \u2500\u2500 PROGRAMMATIC MODE (no frame, fully designed background) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const W = 1772, H = 720;
  const canvas = Canvas.createCanvas(W, H), ctx = canvas.getContext("2d");

  clipRounded(ctx, W, H, 28)
  await drawCardBg(ctx, W, H, { fc: ACCENT, customBg: safeRasterBuffer(backgroundBuffer), texture: false })
  // Gamer: franjas diagonales morado de fondo
  ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = ACCENT; ctx.rotate(-0.5);
  for (let sx = -400; sx < W + 700; sx += 95) ctx.fillRect(sx, -500, 30, H + 1000);
  ctx.restore();
  const cx = 80, cy = 110, cw = 930, ch = 500, cr = 36;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 80; ctx.shadowOffsetY = 20;
  _roundRect(ctx, cx, cy, cw, ch, cr);
  const gg = ctx.createRadialGradient(cx + 100, cy, 0, cx + cw / 2, cy + ch / 2, cw);
  gg.addColorStop(0, _hexRgba(ACCENT, 0.06)); gg.addColorStop(0.5, "rgba(16,16,40,0.85)"); gg.addColorStop(1, "rgba(8,8,24,0.92)");
  ctx.fillStyle = gg; ctx.fill(); ctx.restore();
  _roundRect(ctx, cx, cy, cw, ch, cr); ctx.fillStyle = _hexRgba(ACCENT, 0.03); ctx.fill();
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 20;
  const ga = ctx.createLinearGradient(cx + 12, cy + 40, cx + 12, cy + ch - 40);
  ga.addColorStop(0, ACCENT); ga.addColorStop(0.5, _hexRgba(ACCENT, 0.6)); ga.addColorStop(1, ACCENT);
  _roundRect(ctx, cx + 12, cy + 40, 5, ch - 80, 2.5); ctx.fillStyle = ga; ctx.fill(); ctx.restore();
  const asz = 194, ax = cx + 60, ay = cy + (ch - asz) / 2;
  if (showAvatar) { try {
    const av = await Canvas.loadImage(safeRasterBuffer(avatarBuffer));
    ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.6); ctx.shadowBlur = 40; ctx.shadowOffsetY = 5;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2 + 8, 0, Math.PI * 2); ctx.closePath();
    const rg = ctx.createLinearGradient(ax, ay, ax + asz, ay + asz);
    rg.addColorStop(0, ACCENT); rg.addColorStop(0.5, _hexRgba(ACCENT, 0.4)); rg.addColorStop(1, ACCENT);
    ctx.fillStyle = rg; ctx.fill(); ctx.restore();
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    drawCircularAvatar(ctx, av, ax, ay, asz); ctx.restore();
  } catch {} }
  const tx = cx + (showAvatar ? asz + 105 : 70), ty = cy + 180, mw = cw - (tx - cx) - 80;
  const name = fitCardText(ctx, data.username, mw, { maxSize: 60, minSize: 26, family: 'Genta, "DM Sans", Arial, sans-serif' });
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#FFFFFF"; ctx.fillText(name.text, tx, ty); ctx.restore();
  const nw = name.width;
  if (showDiscriminator && data.discriminator && data.discriminator !== "0") {
    ctx.font = '28px "DM Sans", Arial, sans-serif'; ctx.fillStyle = "#9999AA"; ctx.fillText(`#${data.discriminator}`, tx + nw + 20, ty - 2);
  }
  const lY = ty + 45; ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.4); ctx.shadowBlur = 12;
  const ag = ctx.createLinearGradient(tx, lY, tx + 90, lY);
  ag.addColorStop(0, ACCENT); ag.addColorStop(0.6, _hexRgba(ACCENT, 0.5)); ag.addColorStop(1, "transparent");
  ctx.fillStyle = ag; ctx.fillRect(tx, lY, 90, 4); ctx.restore();
  let dY = lY + 55;
  if (showServerName) {
    ctx.font = '28px "DM Sans", Arial, sans-serif'; ctx.fillStyle = ACCENT;
    const msg = fitCardText(ctx, isLeave ? `Gracias por visitarnos, ${data.guildName}` : `Te damos la bienvenida a ${data.guildName}`, mw, { maxSize: 28, minSize: 28, family: '"DM Sans", Arial, sans-serif' });
    ctx.fillText(msg.text, tx, dY); dY += 48;
  }
  if (showMemberCount) {
    ctx.font = '20px "DM Sans", Arial, sans-serif'; ctx.fillStyle = "#8888AA";
    ctx.fillText(`Miembros actuales: ${data.memberCount}`, tx, dY);
  }
  const bx = cx + cw - 28, by = cy + 36;
  ctx.save(); ctx.shadowColor = _hexRgba(ACCENT, 0.3); ctx.shadowBlur = 20;
  _roundRect(ctx, bx - 134, by, 134, 46, 23); ctx.fillStyle = _hexRgba(ACCENT, 0.12); ctx.fill(); ctx.restore();
  ctx.save(); _roundRect(ctx, bx - 130, by + 2, 130, 42, 21); ctx.strokeStyle = _hexRgba(ACCENT, 0.25); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  ctx.font = '15px UbuntuMono'; ctx.fillStyle = ACCENT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(isLeave ? "HASTA PRONTO" : "NUEVO MIEMBRO", bx - 67, by + 23); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  drawNoise(ctx, W, H, 6);
  return canvas.encode('png');
}

module.exports = { drawNoise, drawCircularAvatar, fitCardText, renderLeaveCard, renderWelcomeCard }
