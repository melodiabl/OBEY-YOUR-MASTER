const {test}=require('node:test'),assert=require('node:assert/strict'),{PermissionsBitField}=require('discord.js')
const mount=require('../dashboard/welcome-routes'),{canManageGuild}=require('../handlers/permissions'),{ConfigurationError}=require('../handlers/welcome-configuration')
function fixture(){
 const routes=new Map(),app={get:(path,...handlers)=>routes.set(`GET ${path}`,handlers),post:(path,...handlers)=>routes.set(`POST ${path}`,handlers)}
 let reads=0,validChannel=true,allowedBot=true
 const guild={id:'g',channels:{fetch:async()=>new Map(validChannel?[['chat',{type:0,permissionsFor:member=>new PermissionsBitField(member.id==='bot'&&!allowedBot?0n:8n)}]]:[])},members:{fetch:async()=>({id:'actor',permissions:new PermissionsBitField(8n)}),fetchMe:async()=>({id:'bot'})}}
 const settings={guildKey:'guildId',exclusive:async fn=>fn(),get:()=>null,patchCached(){},model:{findOne:()=>({lean:async()=>{reads++;return null}}),findOneAndUpdate:async()=>{throw new ConfigurationError('stale','configuration_conflict')}}}
 mount(app,{settings,guilds:{cache:new Map([['g',guild]])}},{canManageGuild,requireAuth:(req,res,next)=>req.session.user?next():res.status(401).json({error:'not_authenticated'}),requireFreshGuildPermissions:(req,res,next)=>next()})
 async function request(method,user,body={}){let i=0;const req={params:{guildId:'g'},session:{user},body},res={code:200,set(){},status(code){this.code=code;return this},json(body){this.body=body}};const handlers=routes.get(`${method} /api/config/:guildId/welcome`);await(async function next(){if(handlers[i])return handlers[i++](req,res,next)})();return res}
 return{request,reads:()=>reads,denyChannel:()=>validChannel=false,denyBot:()=>allowedBot=false}
}
const admin={id:'actor',guilds:[{id:'g',permissions:'32'}]},body={channelId:'chat',message:'Hello',revision:'a'.repeat(64)}
test('welcome API denies unauthorized and injected requests before storage',async()=>{
 const f=fixture();assert.equal((await f.request('GET',null)).code,401);assert.equal((await f.request('GET',{id:'actor',guilds:[]})).code,403);assert.equal((await f.request('POST',admin,{...body,actorId:'other'})).code,400);assert.equal(f.reads(),0)
 assert.equal((await f.request('GET',admin)).code,200);assert.equal(f.reads(),1)
})
test('welcome API requires a real channel and publishing permissions and exposes revision conflicts distinctly',async()=>{
 const f=fixture();f.denyChannel();assert.equal((await f.request('POST',admin,body)).code,400);assert.equal(f.reads(),0)
 const denied=fixture();denied.denyBot();assert.equal((await denied.request('POST',admin,body)).code,403);assert.equal(denied.reads(),0)
 const stale=fixture();assert.equal((await stale.request('POST',admin,body)).code,409)
})
