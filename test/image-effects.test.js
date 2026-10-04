const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const effects = require('../handlers/image-effects')
const { native, avatarData } = require('../handlers/meme-service')
const Neko = require('../handlers/neko-provider')

test('native image filters return valid images and preserve transparent circle edges', async () => {
  const canvas=createCanvas(20,20),context=canvas.getContext('2d');context.fillStyle='#ff0000';context.fillRect(0,0,20,20)
  const source=canvas.toBuffer('image/png')
  for(const name of ['invert','greyscale','sepia','blur','circle']) {
    const image=await loadImage(await effects[name](source));assert.ok(image.width>0)
    if(name==='circle'){const c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);assert.equal(ctx.getImageData(0,0,1,1).data[3],0)}
  }
})
test('replacement text memes produce renderable PNGs', async () => {
  for(const name of ['stonks','notstonks','drake','tornado'])assert.equal((await loadImage(native(name,'Prueba','Otra línea'))).width,800)
})
test('avatar download rejects arbitrary destinations before making requests', async () => {
  await assert.rejects(avatarData('http://127.0.0.1/private'),/avatar válido/)
  await assert.rejects(avatarData('https://example.com/image'),/avatar válido/)
})
test('retired provider endpoints report their actual availability', async () => {
  const neko=new Neko()
  assert.equal(typeof neko.hug,'function')
  await assert.rejects(neko.nsfw.hentai(),/retiró/)
})
