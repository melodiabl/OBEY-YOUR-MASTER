const {test}=require('node:test'),assert=require('node:assert/strict')
const mount=require('../dashboard/architect-routes'),{canManageGuild}=require('../handlers/permissions')
test('template routes enforce guild access, actor scope and reject injected bodies before writes',async()=>{
 const routes=new Map(),calls=[]
 const app={get:(path,...handlers)=>routes.set(`GET ${path}`,handlers),post:(path,...handlers)=>routes.set(`POST ${path}`,handlers)}
 const templates={list:async actor=>{calls.push(['list',actor]);return{official:[],private:[]}},get:async(id,actor)=>{calls.push(['get',id,actor]);throw Object.assign(new Error('private'),{code:'template_not_found'})},import:async(actor,value)=>{calls.push(['import',actor,value]);return{id:'new'}}}
 mount(app,{architect:{},architectTemplates:templates,guilds:{cache:new Map([['g',{id:'g'}]])}},{canManageGuild,requireAuth:(req,res,next)=>req.session.user?next():res.status(401).json({error:'not_authenticated'}),requireFreshGuildPermissions:(req,res,next)=>next()})
 const admin={id:'actor',guilds:[{id:'g',permissions:'32'}]}
 async function request(method,path,user,body={}){let offset=0;const req={params:{guildId:'g',templateId:'foreign'},session:{user},body},res={code:200,set(){},status(code){this.code=code;return this},json(body){this.body=body}};const handlers=routes.get(`${method} ${path}`);await(async function next(){if(handlers[offset])return handlers[offset++](req,res,next)})();return res}
 assert.equal((await request('GET','/api/architect/:guildId/templates',null)).code,401)
 assert.equal((await request('GET','/api/architect/:guildId/templates',{id:'actor',guilds:[]})).code,403)
 assert.equal((await request('POST','/api/architect/:guildId/templates/import',admin,{template:{},ownerId:'other'})).code,400);assert.equal(calls.length,0)
 assert.equal((await request('GET','/api/architect/:guildId/templates',admin)).code,200)
 assert.equal((await request('GET','/api/architect/:guildId/templates/:templateId',admin)).code,404)
 assert.deepEqual(calls,[['list','actor'],['get','foreign','actor']])
})
