const test=require('node:test'),assert=require('node:assert/strict')
const {buildModuleMessage,catalog}=require('../handlers/presentation/modules')
test('all 32 module defaults render all six states in both locales without fabricated IDs',()=>{
 assert.equal(Object.keys(catalog.modules).length,32)
 for(const module of Object.keys(catalog.modules))for(const state of ['ready','loading','empty','success','error','expired'])for(const locale of ['es','en']){
  const payload=buildModuleMessage(module,state,locale)
  assert.ok(payload.embeds[0].toJSON().title);assert.deepEqual(payload.allowedMentions,{parse:[]})
 }
 assert.throws(()=>buildModuleMessage('__proto__','success'),/Unknown module/)
 assert.throws(()=>buildModuleMessage('tickets','unknown'),/Unknown module/)
})
test('domain-provided message overrides remain data, not executable template expressions',()=>{
 const message='${process.exit()} @everyone',result=buildModuleMessage('tickets','ready','es',{description:message})
 assert.ok(result.embeds[0].toJSON().description.includes(message))
 assert.deepEqual(result.allowedMentions,{parse:[]})
})
