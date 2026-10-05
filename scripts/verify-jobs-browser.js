// Optional Playwright driver; explicit isolated fixtures only, never dotenv.
const root=require('node:path').resolve(__dirname,'..')
const mongoUrl=process.env.OBEY_JOBS_TEST_MONGO_URL
const redisUrl=process.env.OBEY_JOBS_TEST_REDIS_URL
if(!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_jobs_test$/.test(mongoUrl||'')||!/^redis:\/\/127\.0\.0\.1:\d+\/15$/.test(redisUrl||''))throw Error('Explicit isolated browser fixtures required')
const express=require(root+'/node_modules/express'),session=require(root+'/node_modules/express-session'),mongoose=require(root+'/node_modules/mongoose')
const {PermissionsBitField}=require(root+'/node_modules/discord.js'),{Queue}=require(root+'/node_modules/bullmq')
const {chromium}=require('playwright')
const {randomUUID}=require('node:crypto'),http=require('node:http'),fs=require('node:fs')
const {csrfProtection}=require(root+'/dashboard/security'),{sessionAuth}=require(root+'/dashboard/auth'),{canManageGuild}=require(root+'/handlers/permissions')
const {createJobsRuntime,connectionOptions}=require(root+'/handlers/jobs/runtime')
;(async()=>{
 let browser,server,runtime,queue,model,restoreModel,planModel,guardModel,release,allowed=true,block=false,reads=0,edits=0
 const queueName='obey-browser-'+randomUUID()
 try{
  await mongoose.connect(mongoUrl,{serverSelectionTimeoutMS:3000})
  model=require(root+'/database/schemas/JobSchema')
  const channels=[{id:'cat',name:'General',type:4,parentId:null,rawPosition:0,permissionOverwrites:{cache:new Map()}},{id:'chat',name:'conversación',type:0,parentId:'cat',rawPosition:1,topic:'Habla con la comunidad',permissionOverwrites:{cache:new Map()}}]
  const roles=[{id:'browser_guild',name:'@everyone',position:0,permissions:new PermissionsBitField(1024n),color:0,managed:false},
   {id:'staff',name:'Staff',position:1,permissions:new PermissionsBitField(0n),color:0,managed:false,colors:{primaryColor:0,secondaryColor:null,tertiaryColor:null}}]
  for(const channel of channels)channel.permissionsFor=()=>new PermissionsBitField(allowed?8n:0n)
  const member=id=>({id,permissions:new PermissionsBitField(allowed?8n:0n),roles:{highest:{position:50}}})
  const guild={id:'browser_guild',name:'Comunidad de prueba',ownerId:'browser_actor',members:{fetch:async({user})=>member(user),fetchMe:async()=>member('browser_bot')},
   channels:{cache:new Map(channels.map(item=>[item.id,item])),fetch:async()=>new Map(channels.map(item=>[item.id,item])),edit:async(id,patch)=>{edits++;const channel=channels.find(item=>item.id===id);if(patch.name!==undefined)channel.name=patch.name;if(patch.topic!==undefined)channel.topic=patch.topic}},
   roles:{cache:new Map(roles.map(item=>[item.id,item])),fetch:async()=>new Map(roles.map(item=>[item.id,item])),edit:async(id,patch)=>{edits++;const role=roles.find(item=>item.id===id);if(patch.colors){role.colors=patch.colors;role.color=patch.colors.primaryColor}if(patch.name!==undefined)role.name=patch.name}}}
  restoreModel=require(root+'/database/schemas/ArchitectRestorePointSchema')
  const restorePoints=require(root+'/handlers/architect/restore-points').createRestorePointService({repository:require(root+'/handlers/architect/restore-point-repository').createRestorePointRepository(restoreModel)})
  const repository=require(root+'/handlers/jobs/repository').createJobRepository()
  let applications,execute
  runtime=createJobsRuntime({repository,redisUrl,queueName,prepareApply:input=>applications.payload(input.applicationId,input.guildId,input.actorId),
   authorize:async()=>{if(!allowed)throw new(require(root+'/handlers/jobs/service').JobError)('Permission denied','permission_denied')},
   handlers:{'architect.snapshot':async()=>{reads++;if(block)await new Promise(resolve=>release=resolve);return require(root+'/handlers/architect/snapshot').snapshotGuild(guild)},'architect.backup':(record,lease)=>restorePoints.create(guild,record.actorId,record._id,lease),'architect.apply':(record,lease)=>execute(guild,record,lease)}})
  const service=require(root+'/handlers/architect/service').createArchitectService({applyAvailable:()=>true})
  planModel=require(root+'/database/schemas/ArchitectApplicationPlanSchema');guardModel=require(root+'/database/schemas/ArchitectGuildOperationSchema')
  applications=require(root+'/handlers/architect/application').createApplicationService({repository:require(root+'/handlers/architect/application-repository').createApplicationRepository(planModel),preview:(...args)=>service.preview(...args),jobs:()=>runtime,enabled:()=>true})
  execute=require(root+'/workers/architect-edits').createEditExecutor({repository,restorePoints,guildOperations:require(root+'/handlers/architect/application-repository').createGuildOperationRepository(guardModel),enabled:()=>true})
  await runtime.start()
  queue=new Queue(queueName,{connection:connectionOptions(redisUrl)});queue.on('error',()=>{})
  const app=express();server=http.createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const origin='http://127.0.0.1:'+server.address().port
  app.use(express.json());app.use(session({secret:'isolated-jobs-browser',resave:false,saveUninitialized:false}));app.use(csrfProtection(origin))
  app.set('views',root+'/dashboard/views');app.set('view engine','ejs');app.use(express.static(root+'/dashboard/public'))
  app.get('/fixture-login',(req,res)=>{req.session.user={id:'browser_actor',username:'Prueba',expires_at:Date.now()+7200000,guilds:[{id:guild.id,permissions:'32'}]};res.redirect('/architect/'+guild.id)})
  app.get('/api/stats',(req,res)=>res.json({guilds:1}))
  require(root+'/dashboard/architect-routes')(app,{architect:service,architectApplications:applications,jobs:runtime,restorePoints,guilds:{cache:new Map([[guild.id,guild]])}},
   {canManageGuild,requireAuth:sessionAuth(async()=>{throw Error('expired')}),requireFreshGuildPermissions:(req,res,next)=>{req.session.user.guilds=[{id:guild.id,permissions:allowed?'32':'0'}];next()}})
  browser=await chromium.launch({headless:true});const errors=[]
  const context=await browser.newContext({viewport:{width:1365,height:1000}})
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({body:'',contentType:'text/css'}))
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message))
  await page.goto(origin+'/fixture-login');await page.waitForFunction(()=>!document.querySelector('#architect-analyze').disabled)
  await page.locator('#architect-analyze').click()
  await page.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Completado'))
  if(reads!==1)throw Error('Job did not use the actual worker provider')
  if(!await page.locator('#architect-jobs').textContent().then(text=>text.includes('Pasos completados: 1 de 1')&&text.includes('2 canales/categorías')))throw Error('Missing persisted job result')
  await page.locator('#architect-backup').click();await page.waitForFunction(()=>document.querySelector('#architect-restore-points').textContent.includes('Inspeccionar copia'))
  await page.locator('#architect-restore-points button').click();await page.waitForFunction(()=>document.querySelector('#architect-restore-points').textContent.includes('conversación'))
  if(!await page.locator('#architect-restore-points').textContent().then(text=>text.includes('No incluye mensajes')&&text.includes('@everyone')))throw Error('Restore point inspection omitted limits or actual structure')
  await page.reload();await page.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Completado'))
  const second=await context.newPage();await second.goto(origin+'/architect/'+guild.id);await second.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Completado'))
  await page.locator('[data-resource-id="chat"]').click();await page.locator('#architect-name').fill('nuevo-canal');await page.locator('#architect-edit').click()
  await page.locator('[data-resource-id="staff"]').click();await page.locator('#architect-color').fill('#123456');await page.locator('#architect-edit').click()
  await page.locator('#architect-prepare-application').click();await page.waitForFunction(()=>!document.querySelector('#architect-confirm-application').hidden)
  if(edits!==0)throw Error('Preparing a plan mutated Discord fixture')
  page.once('dialog',dialog=>dialog.accept());await page.locator('#architect-confirm-application').click()
  await page.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('2 recursos editados'))
  if(edits!==2||channels.find(item=>item.id==='chat').name!=='nuevo-canal'||roles.find(item=>item.id==='staff').colors.primaryColor!==0x123456)throw Error('Confirmed application did not persist the actual fixture edits')
  const prior=await restorePoints.list(guild.id,'browser_actor');if(prior.length!==2)throw Error('Application did not capture a separate prior point')
  const beforeApply=await restorePoints.get(prior.find(point=>point.origin==='before_apply').id,guild.id,'browser_actor')
  if(beforeApply.snapshot.channels.find(item=>item.id==='chat').name!=='conversación')throw Error('Prior point captured after the edit')
  if(beforeApply.snapshot.roleColors.staff.primaryColor!==0)throw Error('Prior point captured after the role color edit')
  block=true;await page.locator('#architect-analyze').click();await page.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Cancelar análisis'))
  await page.locator('#architect-jobs button').click();release();block=false
  await page.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Cancelado'))
  await second.waitForFunction(()=>document.querySelector('#architect-jobs').textContent.includes('Cancelado'))
  await page.screenshot({path:root+'/docs/platform/evidence/jobs-desktop.png',fullPage:true})
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=0);await page.screenshot({path:root+'/docs/platform/evidence/jobs-mobile.png',fullPage:true})
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow')
  await runtime.close();await page.reload();await page.waitForFunction(()=>document.querySelector('#architect-jobs-status').textContent.includes('no están disponibles'))
  if(!await page.locator('#architect-analyze').isDisabled())throw Error('Unavailable queue still offers job submission')
  let held=false,releaseDelayed,fulfilled
  const delivered=new Promise(resolve=>fulfilled=resolve)
  await second.route('**/api/architect/browser_guild/jobs',async route=>{
   if(held||route.request().method()!=='GET')return route.continue()
   held=true;const response=await route.fetch();await new Promise(resolve=>releaseDelayed=resolve);await route.fulfill({response});fulfilled()
  })
  await second.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')))
  while(!releaseDelayed)await new Promise(resolve=>setTimeout(resolve,20))
  const before=reads;allowed=false;await second.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await second.waitForFunction(()=>document.querySelector('#architect-jobs-status').textContent.includes('permisos'))
  releaseDelayed();await delivered;await second.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  if(await second.locator('#architect-jobs').textContent()!=='')throw Error('Revocation left a private job visible')
  if(await second.locator('#architect-restore-points').textContent()!=='')throw Error('Revocation left a private restore point visible')
  if(reads!==before)throw Error('Unauthorized source read')
  const result={scope:'Chromium, Express/EJS/session/CSRF and actual MongoDB/Redis/BullMQ; fixture Discord provider',states:['submit','measured steps','completed result','create structural restore point','inspect actual copy and completeness limits','reload','second tab','prepare without effects','explicit confirmation','fixture edit and prior point','cancel','queue unavailable','permission revoked','late authorized response rejected'],desktop:1365,mobile:390,overflow:false,errors}
  if(errors.length)throw Error(errors.join('; '))
  fs.writeFileSync(root+'/docs/platform/evidence/jobs-browser.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result))
 }finally{
  release?.();await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await runtime?.close()
  if(queue){await queue.obliterate({force:true});await queue.close()}
  if(model)await model.deleteMany({guildId:'browser_guild',actorId:'browser_actor'});if(restoreModel)await restoreModel.deleteMany({guildId:'browser_guild',actorId:'browser_actor'});if(planModel)await planModel.deleteMany({guildId:'browser_guild',actorId:'browser_actor'});if(guardModel)await guardModel.deleteMany({_id:'browser_guild'});await mongoose.disconnect()
 }
})().catch(error=>{console.error(error);process.exitCode=1})
