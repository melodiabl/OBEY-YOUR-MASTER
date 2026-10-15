const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm')
const { createSystemEmoji, map } = require('../handlers/assets/system')
const { catalog } = require('../handlers/assets/production')
const fake = { markup: key => `<:obey_${key.replace(/\W/g,'_')}:123456789012345678>`, emoji: key => ({id:'123456789012345678',name:key,animated:false}), imageURL: key => 'https://example.test/'+key+'.png' }
const ui = createSystemEmoji(fake)
test('every reviewed glyph and legacy cloud reference resolves to a material that exists', () => {
  for (const key of [...Object.values(map.unicode),...Object.values(map.legacyIds)]) assert.ok(catalog.entries[key], key)
  assert.equal(Object.keys(map.legacyIds).length, 71)
})
test('owned messages resolve UI glyphs and old IDs without touching unknown server emoji', () => {
  assert.equal(ui.owned('✅ <a:Loading:833101350623117342>'), fake.markup('icon.success')+' '+fake.markup('motion.cargando'))
  assert.equal(ui.owned('<:server:423456789012345678>'), '<:server:423456789012345678>')
})
test('components and reactions use the correct Discord data type', () => {
  assert.deepEqual(ui.component('✅'),fake.emoji('icon.success'))
  assert.equal(ui.reaction('833101993668771842'),'123456789012345678')
  assert.equal(ui.component('423456789012345678'),'423456789012345678');assert.equal(ui.component('__proto__'),'__proto__');assert.equal(ui.matchesReaction({id:'423456789012345678',name:'server'},'<:server:423456789012345678>'),true);assert.equal(ui.matchesReaction(null,'✅'),false)
  const server={id:'423456789012345678',name:'server'}; assert.equal(ui.component(server),server)
})
test('reaction predicates match registered IDs instead of obsolete Unicode names', () => {
  assert.equal(ui.matchesReaction({id:'123456789012345678',name:'obey_ordinal_1'},'1️⃣'),true)
  assert.equal(ui.matchesReaction({id:'423456789012345678',name:'another'},'1️⃣'),false)
})
test('inherited templates retain expressions and user interpolation unchanged', () => {
  const text='`✅ ${user.name} ${"❌" === "❌"}`', result=ui.catalog(text)
  assert.ok(result.includes('${user.name}'));assert.ok(result.includes('${"❌" === "❌"}'))
  const user={name:'Persona 🎮'}
  assert.ok(vm.runInNewContext(result,{user}).includes('Persona 🎮 true'))
})
test('plain labels contain no markup and numbered labels remain readable', () => {
  assert.equal(ui.plain('✅ Confirmar'),'Confirmar');assert.equal(ui.plain('1️⃣'),'1')
  assert.equal(ui.plain(fake.markup('icon.success')+' Confirmar'),'Confirmar')
})
test('missing IDs keep readable fallbacks and never invent a CDN URL', () => {
  const fallback=createSystemEmoji({markup:()=> '✅',emoji:()=>({name:'✅'})})
  assert.equal(fallback.reaction('833101995723194437'),'✅');assert.equal(fallback.image('icon.success'),null)
})
test('message truncation never leaves half of a surrogate or custom emoji token', () => {
  const value='A'.repeat(250)+fake.markup('icon.success')
  const limited=ui.limit(value,256);assert.equal(limited,'A'.repeat(250)+'…');assert.ok(limited.length<=256)
})
test('game pieces have their own resources while game logic tokens stay unchanged', () => {
  const assets={...fake,emoji:key=>({name:key})}, local=createSystemEmoji(assets)
  assert.equal(local.gameComponent('❌').name,'icon.game-cross')
  assert.equal(local.gameComponent('⭕').name,'icon.game-ring')
})
test('old CDN images including Discord proxies resolve to verified own images', () => {
  assert.equal(ui.owned('https://cdn.discordapp.com/emojis/833101995723194437.gif?size=128'),fake.imageURL('icon.success'))
  assert.equal(ui.owned('https://images-ext-1.discordapp.net/external/cache/https/cdn.discordapp.com/emojis/756773010123522058.gif'),fake.imageURL('motion.cargando'))
})

test('conditional legacy music labels use own material after upload without changing their condition',()=>{
  const input='`${player.playing ? `▶` : `⏸`}`'
  const prepared=ui.catalog(input)
  const playing=vm.runInNewContext(prepared,{player:{playing:true},client:{emojiAssets:ui}})
  const paused=vm.runInNewContext(prepared,{player:{playing:false},client:{emojiAssets:ui}})
  assert.equal(playing,fake.markup('icon.play'));assert.equal(paused,fake.markup('icon.pause'))
})
