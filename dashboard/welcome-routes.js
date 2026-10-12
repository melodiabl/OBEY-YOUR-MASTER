const {welcomeConfiguration,ConfigurationError}=require('../handlers/welcome-configuration')
const {assertWelcomeChannel}=require('../handlers/welcome-access')
module.exports=(app,client,{requireAuth,requireFreshGuildPermissions,canManageGuild})=>{
 const access=(req,res,next)=>{const guild=client.guilds.cache.get(req.params.guildId);if(!guild)return res.status(404).json({error:'guild_not_found'});if(!canManageGuild(req.session.user,guild.id))return res.status(403).json({error:'no_permission'});req.welcomeGuild=guild;res.set('Cache-Control','private, no-store');return next()}
 const guarded=[requireAuth,requireFreshGuildPermissions,access]
 const wrap=handler=>async(req,res)=>{try{await handler(req,res)}catch(error){const code=error.code;if(error instanceof ConfigurationError)return res.status(code==='configuration_conflict'?409:code==='invalid_configuration'?400:code==='configuration_permissions'?403:503).json({error:code});return res.status(503).json({error:'configuration_storage'})}}
 app.get('/api/config/:guildId/welcome',...guarded,wrap(async(req,res)=>res.json({ok:true,configuration:await welcomeConfiguration(client.settings).read(req.welcomeGuild.id)})))
 app.post('/api/config/:guildId/welcome',...guarded,wrap(async(req,res)=>{
  const body=req.body
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['channelId','message','revision'].includes(key))||!Object.hasOwn(body,'channelId')||typeof body.message!=='string'||typeof body.revision!=='string')throw new ConfigurationError('Invalid welcome request','invalid_configuration')
  await assertWelcomeChannel(req.welcomeGuild,req.session.user.id,body.channelId)
  res.json({ok:true,configuration:await welcomeConfiguration(client.settings).save(req.welcomeGuild.id,{channelId:body.channelId,message:body.message},body.revision)})
 }))
}
