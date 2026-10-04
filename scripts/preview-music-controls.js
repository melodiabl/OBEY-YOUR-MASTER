#!/usr/bin/env node
// Offline approximation from the actual runtime builders; never connects to Discord.
const fs = require('node:fs')
const path = require('node:path')
const { buildControls } = require('../handlers/music/controls')
const { idlePanel } = require('../handlers/music/setup')
const { pathToFileURL } = require('node:url')
const emojiFont = process.env.OBEY_PREVIEW_EMOJI_FONT
const fontCss = emojiFont ? `@font-face{font-family:ObeyPreviewEmoji;src:url(${JSON.stringify(pathToFileURL(path.resolve(emojiFont)).href)})}button span{font-family:ObeyPreviewEmoji,sans-serif}` : ''
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const base = { history: [], paused: false, loop: 'none', volume: 100 }
const cases = [
  ['Reproduciendo · sin historial', buildControls(base)],
  ['Pausado · historial · repetir canción', buildControls({ ...base, paused: true, history: [{}], loop: 'track' })],
  ['Mezclar · repetir cola · autoplay · volumen 200', buildControls({ ...base, shuffle: true, loop: 'queue', autoplay: true, volume: 200 })],
  ['Volumen 0', buildControls({ ...base, volume: 0 })],
  ['Canal vacío · doce acciones deshabilitadas', idlePanel({ user: { displayAvatarURL: () => 'https://example.com/avatar.png' } }).components],
]
const markup = cases.map(([title, rows]) => `<section><h2>${escape(title)}</h2>${rows.map(row => `<div class="row">${row.toJSON().components.map(button => `<button type="button" data-id="${escape(button.custom_id)}" class="style-${button.style}" ${button.disabled ? 'disabled' : ''}><span aria-hidden="true">${escape(button.emoji?.name)}</span> ${escape(button.label)}</button>`).join('')}</div>`).join('')}</section>`).join('')
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OBEY · preview de controles</title><style>
${fontCss}
*{box-sizing:border-box}body{background:#111827;color:#f8fafc;font:15px/1.5 system-ui,sans-serif;margin:0;padding:32px}main{max-width:1000px;margin:auto}h1{font-size:28px;margin:0 0 8px}p{color:#cbd5e1;max-width:780px}section{padding:24px 0;border-top:1px solid #334155}h2{font-size:18px;margin:0 0 16px}.row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}button{font:600 14px/1.4 system-ui,sans-serif;color:#fff;border:0;border-radius:5px;padding:9px 14px;background:#4b5563;min-height:38px}button.style-1{background:#5865f2}button.style-3{background:#248046}button.style-4{background:#b91c1c}button:disabled{opacity:.5}button:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}@media(max-width:480px){body{padding:20px}.row{gap:6px}button{padding:8px 10px}}
</style></head><body><main><h1>OBEY · controles musicales</h1><p>Aproximación local generada por los builders reales. Los estados son datos de prueba; los botones aquí no ejecutan acciones. No es una captura del cliente Discord. Emojis Unicode de respaldo hasta cargar IDs verificados.</p>${markup}</main></body></html>`
const destination = path.resolve(process.argv[2] || '/tmp/obey-music-preview.html')
fs.writeFileSync(destination, html)
console.log(destination)
