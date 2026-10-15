const test = require('node:test'), assert = require('node:assert/strict')
const { createProductionRegistry, catalog } = require('../handlers/assets/production')
const { createRegistry } = require('../handlers/assets/registry')
const { validateProductionAssets } = require('../handlers/assets/production-pipeline')
const { syncEmojis } = require('../handlers/assets/emoji-pipeline')
const app='423456789012345678', id='523456789012345678'
test('selected production catalogue validates every PNG and GIF',async()=>{
 const assets=await validateProductionAssets()
 assert.equal(assets.length,Object.keys(catalog.entries).length);assert.equal(assets.filter(a=>a.animated).length,10)
 await assert.rejects(validateProductionAssets(['../config']),/canonical/)
})
test('animated map renders a validated GIF in markup and components, with app and hash isolation',()=>{
 const key='motion.cargando',entry=catalog.entries[key]
 const map={version:1,applicationId:app,emojis:{[key]:{id,name:entry.name,sha256:entry.sha256,animated:true}}}
 assert.match(createProductionRegistry(map,app).markup(key),/^<a:/)
 assert.equal(createRegistry(map,app).emoji(key).animated,true)
 assert.equal(createProductionRegistry(map,'623456789012345678').emoji(key).id,undefined)
 const wrong=structuredClone(map);wrong.emojis[key].animated=false
 assert.equal(createProductionRegistry(wrong,app).emoji(key).id,undefined)
 wrong.emojis[key].animated=true;wrong.emojis[key].sha256='0'.repeat(64)
 assert.equal(createProductionRegistry(wrong,app).emoji(key).id,undefined)
})
test('legacy consumer keys resolve canonical production IDs without changing their action IDs',()=>{
 const key='icon.play',entry=catalog.entries[key]
 const map={version:1,applicationId:app,emojis:{[key]:{id,name:entry.name,sha256:entry.sha256,animated:false}}}
 assert.equal(createRegistry(map,app).emoji('play').id,id)
 assert.equal(createRegistry(map,app).emoji(key).id,id)
})
test('GIF sync reconciles a lost response, checkpoints animation and does not duplicate uploads',async()=>{
 const assets=await validateProductionAssets(['motion.cargando']),stored=[];let attempts=0
 const adapter={list:async()=>stored,create:async name=>{attempts++;stored.push({id,name,animated:true});throw new Error('lost')}}
 let saved
 const result=await syncEmojis({assets,applicationId:app,adapter,save:async value=>{saved=structuredClone(value)}})
 assert.equal(attempts,1);assert.equal(saved.emojis['motion.cargando'].animated,true)
 assert.match(createRegistry(result,app).markup('motion.cargando'),/^<a:/)
 await syncEmojis({assets,applicationId:app,adapter,save:async()=>{},previous:result})
 assert.equal(attempts,1)
})
test('embed author image uses an application emoji URL only after verified upload',()=>{
 const key='motion.reproduciendo',entry=catalog.entries[key]
 const map={version:1,applicationId:app,emojis:{[key]:{id,name:entry.name,sha256:entry.sha256,animated:true}}}
 assert.equal(createRegistry({},app).imageURL(key),undefined)
 assert.equal(createRegistry(map,app).imageURL(key),`https://cdn.discordapp.com/emojis/${id}.gif`)
})
