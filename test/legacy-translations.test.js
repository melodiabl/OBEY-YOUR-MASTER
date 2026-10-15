const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const es=require('../languages/es.json'),en=require('../languages/en.json')
function at(object,key){return key.split('.').reduce((value,part)=>value[part],object)}
test('repaired Spanish variables use canonical expressions from their English peer',()=>{
 const repairs=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audit/es-placeholder-repairs.json'),'utf8'))
 assert.ok(repairs.changes.length>1500)
 for(const row of repairs.changes){assert.ok(at(es,row.key).includes(row.to),row.key);assert.ok(at(en,row.key).includes(row.to),row.key)}
})
test('Spanish legacy templates compile without evaluating their contents',()=>{
 let count=0
 function walk(value){for(const item of Object.values(value)){
  if(item&&typeof item==='object')walk(item)
  else if(typeof item==='string'&&item.startsWith('`')&&item.endsWith('`')){new vm.Script('('+item+')');count++}
 }}
 walk(es);assert.ok(count>1000)
})
test('legacy locale loader fills missing keys and migrates reviewed bot-owned Unicode and IDs',()=>{
 const {prepareLegacyCatalog,normalizeLegacyText}=require('../handlers/i18n/legacy')
 const assets={markup:key=>'resolved:'+key}
 const result=prepareLegacyCatalog({one:'English',nested:{message:'Fallback'}},{one:'Español'},assets)
 assert.equal(result.one,'Español');assert.equal(result.nested.message,'Fallback')
 assert.equal(normalizeLegacyText('<:no:833101993668771842> ❌ ⭕',assets),'resolved:icon.error resolved:icon.error resolved:icon.game-ring')
 assert.equal(normalizeLegacyText('<:unknown:123456789012345678>',assets),'<:unknown:123456789012345678>')
 assert.equal({}.polluted,undefined)
})
