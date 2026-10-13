const Canvas = require('@napi-rs/canvas')
const { inspectCardImage } = require('./card-media')
module.exports = async buffer => {
  inspectCardImage(buffer)
  const image = await Canvas.loadImage(buffer)
  const scale = Math.min(1, 1772 / image.width, 720 / image.height)
  const canvas = Canvas.createCanvas(Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)))
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.encode('png')
}
