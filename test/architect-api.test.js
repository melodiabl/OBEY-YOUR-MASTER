const { test } = require('node:test')
const assert = require('node:assert/strict')
const mount = require('../dashboard/architect-routes')
const { canManageGuild } = require('../handlers/permissions')
function fixture() {
 const routes=new Map(),reads=[]
 const app={get:(path,...handlers)=>routes.set(`GET ${path}`,handlers),post:(path,...handlers)=>routes.set(`POST ${path}`,handlers)}
 const client={guilds:{cache:new Map([['g',{id:'g',name:'Guild'}]])}}
 const service={async read(guild,actor){reads.push({guild:guild.id,actor});return {snapshot:{revision:'r'}}},async generate(guild,actor,blueprint,choices){reads.push({guild:guild.id,actor});return {blueprint,choices}},async preview(){throw Object.assign(new Error('changed'),{code:'revision_conflict'})},async save(){throw new Error('private connection string')}}
 mount(app,client,{service,canManageGuild,requireAuth:(req,res,next)=>req.session.user?next():res.status(401).json({error:'not_authenticated'}),requireFreshGuildPermissions:(req,res,next)=>next()})
 async function request(method,path,user,body={},guildId='g') {
  const req={params:{guildId},session:{user},body},res={code:200,set(){},status(code){this.code=code;return this},json(body){this.body=body},render(){}}
  let index=0;const handlers=routes.get(`${method} ${path}`)
  await (async function next(){if(handlers[index])return handlers[index++](req,res,next)})()
  return res
 }
 return {request,reads}
}
const admin={id:'u',guilds:[{id:'g',permissions:'32'}]}
test('Architect data and drafts are denied before any source read',async()=>{
 const f=fixture()
 assert.equal((await f.request('GET','/api/architect/:guildId',null)).code,401)
 assert.equal((await f.request('GET','/api/architect/:guildId',{id:'u',guilds:[{id:'g',permissions:'0'}]})).code,403)
 assert.equal((await f.request('GET','/api/architect/:guildId',admin,{},'foreign')).code,404)
 assert.equal(f.reads.length,0)
 assert.equal((await f.request('GET','/api/architect/:guildId',admin)).code,200)
 assert.deepEqual(f.reads,[{guild:'g',actor:'u'}])
})
test('drift conflicts and provider/storage errors have safe distinct responses',async()=>{
 const f=fixture()
 const conflict=await f.request('POST','/api/architect/:guildId/preview',admin,{blueprint:{}})
 assert.equal(conflict.code,409);assert.equal(conflict.body.error,'revision_conflict')
 const failure=await f.request('POST','/api/architect/:guildId/draft',admin,{blueprint:{},expectedRevision:0})
 assert.equal(failure.code,503);assert.equal(JSON.stringify(failure.body).includes('private'),false)
})
test('wizard generation uses the shared service and rejects unauthorized or injected requests before generation',async()=>{
 const f=fixture(),path='/api/architect/:guildId/generate',body={blueprint:{baseRevision:'r'},choices:{community:'gaming'}}
 assert.equal((await f.request('POST',path,null,body)).code,401)
 assert.equal((await f.request('POST',path,{id:'u',guilds:[{id:'g',permissions:'0'}]},body)).code,403)
 assert.equal((await f.request('POST',path,admin,{...body,payload:{apply:true}})).code,400)
 assert.equal(f.reads.length,0)
 const generated=await f.request('POST',path,admin,body)
 assert.equal(generated.code,200);assert.deepEqual(generated.body.blueprint,body.blueprint)
 assert.deepEqual(f.reads,[{guild:'g',actor:'u'}])
})
