const { test } = require('node:test')
const assert = require('node:assert/strict')
const { captureTemplate, validateTemplate } = require('../handlers/templates/format')
const { mergeTemplate } = require('../handlers/templates/merge')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
function fixture() {
  const guildId='123456789012345678', roleId='123456789012345679', categoryId='123456789012345680', channelId='123456789012345681'
  const role = (id,name,managed=false)=>({id,name,managed,position:1,permissions:'0',color:123,hoist:false,mentionable:false})
  const channel=(id,name,type,parentId=null)=>({id,name,type,parentId,position:3,topic:'',nsfw:false,bitrate:null,userLimit:null,rateLimitPerUser:0,overwrites:[]})
  const source={guildId,revision:'r',roles:[role(guildId,'@everyone'),role(roleId,'Member'),role('123456789012345682','Bot',true)],channels:[channel(categoryId,'Community',4),channel(channelId,'chat',0,categoryId)],roleColors:{[roleId]:{primaryColor:123,secondaryColor:null,tertiaryColor:null}}}
  const blueprint={schemaVersion:1,baseRevision:'r',channels:structuredClone(source.channels),roles:structuredClone(source.roles),protectedIds:[]}
  return{source,blueprint,roleId,categoryId,channelId}
}
test('capture preserves role/channel properties and remaps every active resource reference',()=>{
  const f=fixture();f.blueprint.channels[1].overwrites=[{id:f.source.guildId,type:0,allow:'0',deny:'1024'},{id:f.roleId,type:0,allow:'1024',deny:'0'}]
  const definition=captureTemplate(f.blueprint,f.source,{name:'Private base',description:'Structure',selection:'all'})
  assert.equal(definition.format,'obey-template');assert.equal(definition.scope,'structure_only');assert.equal(definition.roles.length,1)
  assert.ok(definition.channels.every(item=>item.id.startsWith('local:')))
  assert.ok(definition.channels[1].overwrites.some(item=>item.id==='everyone'))
  assert.equal(JSON.stringify(definition).includes('123456789012345'),false)
  assert.deepEqual(validateTemplate(definition),definition)
  assert.equal(f.blueprint.channels[1].id,f.channelId)
})
test('new-only capture includes required existing category/role dependencies and rejects unsupported sensitive scopes',()=>{
  const f=fixture();f.blueprint.channels.push({...f.blueprint.channels[1],id:'local:new',name:'new',overwrites:[{id:f.roleId,type:0,allow:'1024',deny:'0'}]})
  const definition=captureTemplate(f.blueprint,f.source,{name:'New space',selection:'new'})
  assert.equal(definition.channels.length,2);assert.equal(definition.roles.length,1)
  f.blueprint.channels[2].overwrites=[{id:'foreign-member',type:1,allow:'0',deny:'1024'}]
  assert.throws(()=>captureTemplate(f.blueprint,f.source,{name:'Bad',selection:'new'}),error=>error.code==='template_unsupported')
  f.blueprint.channels[2].overwrites=[{id:f.source.roles[2].id,type:0,allow:'0',deny:'1024'}]
  assert.throws(()=>captureTemplate(f.blueprint,f.source,{name:'Bad',selection:'new'}),error=>error.code==='template_unsupported')
})
test('portable input rejects raw IDs, broken references, modules/secrets and foreign formats/versions',()=>{
  const f=fixture(),definition=captureTemplate(f.blueprint,f.source,{name:'Base',selection:'all'})
  for(const mutate of [value=>value.roles[0].id=f.roleId,value=>value.channels[1].parentId=f.categoryId,value=>value.channels[0].position=4,value=>value.roles[0].position=4,value=>value.format='discord-template',value=>value.schemaVersion=2,value=>value.modules={token:'secret'},value=>value.channels[1].overwrites=[{id:'foreign',type:0,allow:'0',deny:'0'}]]){
    const bad=structuredClone(definition);mutate(bad);assert.throws(()=>validateTemplate(bad),error=>error.code==='invalid_template')
  }
})
test('merge creates a valid supported proposal and reuses real destination IDs on repeat without duplicates',()=>{
  const f=fixture(),definition=captureTemplate(f.blueprint,f.source,{name:'Base',selection:'all'})
  const destination={guildId:'destination',revision:'dest',channels:[],roles:[]},blank={schemaVersion:1,baseRevision:'dest',channels:[],roles:[],protectedIds:[]}
  const result=mergeTemplate(blank,destination,definition),validated=validateBlueprint(result.blueprint,destination)
  assert.equal(result.template.addedChannels,2);assert.equal(result.template.addedRoles,1)
  assert.ok(compileEdits(diffBlueprint(destination,validated)).every(operation=>operation.action==='create'))
  const long=structuredClone(definition);const oldId=long.roles[0].id;long.roles[0].id='local:'+'a'.repeat(64)
  for(const channel of long.channels)for(const overwrite of channel.overwrites)if(overwrite.id===oldId)overwrite.id=long.roles[0].id
  assert.doesNotThrow(()=>validateBlueprint(mergeTemplate(blank,destination,long).blueprint,destination))
  const real=structuredClone(validated),map=new Map([...real.channels,...real.roles].map((item,index)=>[item.id,String(987654321012345678n+BigInt(index))]))
  for(const item of [...real.channels,...real.roles]){item.id=map.get(item.id);item.position=5;if(item.parentId)item.parentId=map.get(item.parentId)}
  destination.channels=real.channels;destination.roles=real.roles;destination.roleColors={[real.roles[0].id]:{primaryColor:123,secondaryColor:null,tertiaryColor:null}}
  const repeated=mergeTemplate(real,destination,definition)
  assert.equal(repeated.template.addedChannels,0);assert.equal(repeated.template.addedRoles,0);assert.deepEqual(repeated.blueprint,real)
})
test('merge rejects incompatible same-name roles/channels and protected category expansion without changing the draft',()=>{
  const f=fixture(),definition=captureTemplate(f.blueprint,f.source,{name:'Base',selection:'all'}),original=structuredClone(f.blueprint)
  f.blueprint.roles[1].permissions='8'
  assert.throws(()=>mergeTemplate(f.blueprint,f.source,definition),error=>error.code==='template_conflict')
  f.blueprint=structuredClone(original);f.blueprint.channels=f.blueprint.channels.slice(0,1);f.blueprint.protectedIds=[f.categoryId]
  assert.throws(()=>mergeTemplate(f.blueprint,f.source,definition),error=>error.code==='template_conflict')
})
