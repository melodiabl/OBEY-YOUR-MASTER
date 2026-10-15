const test=require('node:test'),assert=require('node:assert/strict')
const raw=require('../botconfig/emojis.json')
const {createLegacyEmojiConfig}=require('../handlers/assets/legacy-config')
test('all legacy presentation fields use own resources without changing the raw configuration',()=>{
 const assets={emoji:()=>({id:'123456789012345678'}),markup:key=>`own:${key}`}
 const result=createLegacyEmojiConfig(raw,assets)
 assert.equal(result.msg.SUCCESS,'own:icon.success');assert.equal(result.msg.loading,'own:motion.cargando')
 assert.equal(result.numberEmojis[1],'own:icon.ordinal-1');assert.equal(result.msg.progress_bar.filledframe,'own:icon.progress-filled');assert.equal(result.react.SUCCESS,'123456789012345678')
 assert.equal(result.msg.pause_resume,'own:icon.play');assert.equal(raw.msg.SUCCESS,'✅')
})
test('missing upload IDs retain known Unicode and convert reviewed deleted-cloud references to fallback',()=>{
 const result=createLegacyEmojiConfig(raw,{emoji:()=>({name:'▫️'}),markup:key=>key==='motion.cargando'?'⏳':'▫️'})
 assert.equal(result.msg.SUCCESS,'✅');assert.equal(result.msg.loading,'⏳')
})
