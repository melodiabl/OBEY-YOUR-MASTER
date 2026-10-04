const path = require('node:path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Adaptador de composición. El llamador descarga/valida imágenes y pasa buffers.
// No incluye envío, configuración persistente ni mutación de datos del bot.
const templateRoot = path.join(__dirname, '../assets/templates/png');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/DejaVuSans.ttf'), 'OBEY Sans');
GlobalFonts.registerFromPath(path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf'), 'OBEY Sans');
const baseCache = new Map();
async function base(kind) {
  if (!['welcome', 'farewell', 'music'].includes(kind)) throw new Error('Unknown card kind');
  if (!baseCache.has(kind)) {
    baseCache.set(kind, loadImage(path.join(templateRoot, `obey_${kind}_base.png`)).catch(error => {
      baseCache.delete(kind);
      throw error;
    }));
  }
  return baseCache.get(kind);
}
function fitted(ctx, value, x, y, maxWidth, size, color = '#FFFFFF', weight = 'bold') {
  ctx.fillStyle = color;
  let label = String(value ?? '');
  for (let s = size; s >= 22; s -= 2) {
    ctx.font = `${weight} ${s}px "OBEY Sans", sans-serif`;
    if (ctx.measureText(label).width <= maxWidth) { ctx.fillText(label, x, y); return; }
  }
  const chars = Array.from(label);
  while (chars.length && ctx.measureText(chars.join('') + '…').width > maxWidth) chars.pop();
  ctx.fillText(chars.join('') + '…', x, y);
}
async function renderCard(kind, options = {}) {
  const canvas = createCanvas(1772, 633);
  const ctx = canvas.getContext('2d');
  // The bundled fonts make the sample and bot renders reproducible.
  if (options.backgroundBuffer) ctx.drawImage(await loadImage(options.backgroundBuffer), 0, 0, 1772, 633);
  else ctx.drawImage(await base(kind), 0, 0, 1772, 633);
  if (kind === 'music') {
    if (options.artworkBuffer) ctx.drawImage(await loadImage(options.artworkBuffer), 52, 108, 400, 400);
    fitted(ctx, options.title || 'Sin título', 500, 210, 630, 60);
    fitted(ctx, options.artist || 'Artista desconocido', 500, 290, 630, 34, '#C3CCE0', 'normal');
    fitted(ctx, options.requester ? `Pedido por ${options.requester}` : 'OBEY · Música', 500, 365, 630, 28, '#FFD574', 'normal');
    // Progress and lyrics stay in native embeds; do not bake time into this image.
  } else {
    if (options.avatarBuffer) {
      const avatar = await loadImage(options.avatarBuffer);
      ctx.save(); ctx.beginPath(); ctx.arc(228, 316, 154, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(avatar, 74, 162, 308, 308); ctx.restore();
    }
    fitted(ctx, options.heading || (kind === 'welcome' ? '¡Bienvenido!' : 'Hasta pronto'), 432, 220, 650, 64, '#FFD574');
    fitted(ctx, options.memberName || 'Miembro', 432, 305, 650, 60);
    fitted(ctx, options.serverName || '', 432, 385, 650, 34, '#C3CCE0', 'normal');
    if (options.memberCount != null) fitted(ctx, `Miembros actuales: ${options.memberCount}`, 432, 450, 650, 28, '#C3CCE0', 'normal');
  }
  return canvas.encode('png');
}
module.exports = { renderCard };
