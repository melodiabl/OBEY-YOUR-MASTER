const { canvacord } = require('canvacord')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
async function pixels(source, mode) {
  const image = await loadImage(source)
  const canvas = createCanvas(Math.min(image.width, 1024), Math.min(image.height, 1024))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const [r,g,b] = data.data.slice(i,i+3)
    if (mode === 'invert') { data.data[i]=255-r; data.data[i+1]=255-g; data.data[i+2]=255-b }
    else if (mode === 'greyscale') { const grey=Math.round(.299*r+.587*g+.114*b);data.data[i]=data.data[i+1]=data.data[i+2]=grey }
    else { data.data[i]=Math.min(255,.393*r+.769*g+.189*b);data.data[i+1]=Math.min(255,.349*r+.686*g+.168*b);data.data[i+2]=Math.min(255,.272*r+.534*g+.131*b) }
  }
  ctx.putImageData(data,0,0)
  return canvas.toBuffer('image/png')
}
const effects = {
  invert: source => pixels(source,'invert'), greyscale: source => pixels(source,'greyscale'), sepia: source => pixels(source,'sepia'),
  async circle(source) { const image=await loadImage(source),canvas=createCanvas(512,512),ctx=canvas.getContext('2d');ctx.beginPath();ctx.arc(256,256,256,0,2*Math.PI);ctx.clip();ctx.drawImage(image,0,0,512,512);return canvas.toBuffer('image/png') },
  async blur(source) { const image=await loadImage(source),canvas=createCanvas(512,512),ctx=canvas.getContext('2d');ctx.filter='blur(8px)';ctx.drawImage(image,-10,-10,532,532);return canvas.toBuffer('image/png') },
  async trigger(source) { const stream=await canvacord.triggered(source);if(Buffer.isBuffer(stream))return stream;const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks) },
  jokeOverHead: (...args) => canvacord.jokeoverhead(...args),
}
for (const name of ['beautiful','facepalm','kiss','rainbow','rip','wasted']) effects[name]=(...args)=>canvacord[name](...args)
module.exports = effects
