'use strict'
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { assetFor } = require('../assets/production')
const { map } = require('../assets/system')
const images = new Map()
const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' })
async function renderBoard(board, { cellSize = 32 } = {}) {
  if (typeof board !== 'string' || board.length > 10000 || !Number.isInteger(cellSize) || cellSize < 16 || cellSize > 64) throw new Error('INVALID_BOARD')
  const rows = board.trimEnd().split('\n').map(row => [...segmenter.segment(row)].map(s => s.segment))
  const columns = rows[0]?.length
  if (!columns || columns > 20 || rows.length > 20 || rows.some(r => r.length !== columns)) throw new Error('INVALID_BOARD')
  const canvas = createCanvas(columns * cellSize, rows.length * cellSize), context = canvas.getContext('2d')
  context.fillStyle = '#101C38'; context.fillRect(0, 0, canvas.width, canvas.height)
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < columns; x++) {
    const key = map.unicode[rows[y][x]]
    if (!key) throw new Error('UNSUPPORTED_BOARD_TOKEN')
    if (!images.has(key)) images.set(key, loadImage(assetFor(key).path))
    context.drawImage(await images.get(key), x * cellSize, y * cellSize, cellSize, cellSize)
  }
  return canvas.toBuffer('image/png')
}
module.exports = { renderBoard }
