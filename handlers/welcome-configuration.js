const {createHash,randomUUID}=require('node:crypto')
class ConfigurationError extends Error {constructor(message,code){super(message);this.code=code}}
const fail=(message,code='invalid_configuration')=>{throw new ConfigurationError(message,code)}
const paths=['welcome','welcomeChannel','welcomeMessage','welcomeConfigRevision']
function configuration(doc={}){
 const channelId=doc.welcome?.channel??doc.welcomeChannel??null,message=doc.welcome?.msg??doc.welcome?.message??doc.welcomeMessage??''
 if(channelId!==null&&typeof channelId!=='string'||typeof message!=='string'||doc.welcomeConfigRevision!==undefined&&(!Number.isSafeInteger(doc.welcomeConfigRevision)||doc.welcomeConfigRevision<0))fail('La configuración de bienvenida existente no es válida.')
 const revision=createHash('sha256').update(JSON.stringify(paths.map(key=>[key,{present:Object.hasOwn(doc,key),value:Object.hasOwn(doc,key)?doc[key]:null}]))).digest('hex')
 return{channelId:channelId==='nochannel'?null:channelId,message,revision}
}
function validatePatch(patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).some(key=>!['channelId','message'].includes(key)))fail('Cambios de bienvenida inválidos.')
 if(Object.hasOwn(patch,'message')&&(typeof patch.message!=='string'||patch.message.length>500))fail('El mensaje no puede superar 500 caracteres.')
 if(Object.hasOwn(patch,'channelId')&&patch.channelId!==null&&(typeof patch.channelId!=='string'||!/^[a-zA-Z0-9_:-]{1,100}$/.test(patch.channelId)))fail('Canal de bienvenida inválido.')
 return{...patch,...(patch.channelId==='nochannel'?{channelId:null}:{})}
}
function createWelcomeConfiguration(settings){
 const guildId=id=>{if(typeof id!=='string'||!/^[a-zA-Z0-9_:-]{1,100}$/.test(id))fail('Servidor inválido.')}
 const readDoc=async id=>settings.model.findOne({[settings.guildKey]:id}).lean()
 const publish=(id,doc,cachedBefore)=>{
  if(!doc)return
  const patch=Object.fromEntries([...paths,'welcomeConfigLastWrite'].filter(key=>Object.hasOwn(doc,key)).map(key=>[key,doc[key]]))
  const cached=settings.get(id,'welcome')
  if(JSON.stringify(cached)!==JSON.stringify(cachedBefore)&&cached&&typeof cached==='object'&&doc.welcome)patch.welcome={...doc.welcome,...cached,channel:doc.welcome.channel,msg:doc.welcome.msg,message:doc.welcome.message}
  settings.patchCached(id,patch)
 }
 const serial=operation=>settings.exclusive(operation)
 return{
  async read(id){guildId(id);try{return await serial(async()=>{const cachedBefore=structuredClone(settings.get(id,'welcome')),doc=await readDoc(id);const value=configuration(doc||{});publish(id,doc,cachedBefore);return value})}catch(error){if(error instanceof ConfigurationError)throw error;fail('No se pudo leer la bienvenida.','configuration_storage')}},
  async save(id,input,expectedRevision,operationId=randomUUID(),publication){
   guildId(id);const patch=validatePatch(input)
   if(expectedRevision!==undefined&&(typeof expectedRevision!=='string'||!/^[a-f0-9]{64}$/.test(expectedRevision)))fail('Revisión de bienvenida inválida.')
   if(typeof operationId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(operationId))fail('Operación de bienvenida inválida.')
   if(publication&&(!Number.isSafeInteger(publication.draftRevision)||publication.draftRevision<1||typeof publication.actorId!=='string'||!/^[a-zA-Z0-9_:-]{1,100}$/.test(publication.actorId)))fail('Publicación de bienvenida inválida.')
   try{return await serial(async()=>{
    const cachedBefore=structuredClone(settings.get(id,'welcome')),old=await readDoc(id),before=configuration(old||{}),wanted={channelId:before.channelId,message:before.message,...patch}
    const prior=old?.welcomeConfigLastWrite
    if(prior?.id===operationId){if(before.revision!==prior.after?.revision||wanted.channelId!==prior.after.channelId||wanted.message!==prior.after.message||publication&&(prior.draftRevision!==publication.draftRevision||prior.actorId!==publication.actorId||prior.before.revision!==expectedRevision))fail('La operación de bienvenida cambió.','configuration_conflict');publish(id,old,cachedBefore);return before}
    if(expectedRevision!==undefined&&before.revision!==expectedRevision)fail('La bienvenida cambió desde que la abriste.','configuration_conflict')
    const welcome={...(old?.welcome&&typeof old.welcome==='object'&&!Array.isArray(old.welcome)?old.welcome:{}),channel:wanted.channelId||'nochannel',msg:wanted.message,message:wanted.message}
    const afterDoc={...(old||{}),welcome,welcomeChannel:wanted.channelId,welcomeMessage:wanted.message,welcomeConfigRevision:(old?.welcomeConfigRevision||0)+1}
    const after=configuration(afterDoc),filter={[settings.guildKey]:id}
    for(const path of paths)filter[path]=old&&Object.hasOwn(old,path)?{$eq:old[path]}:{$exists:false}
    const update={$set:{welcome,welcomeChannel:wanted.channelId,welcomeMessage:wanted.message,welcomeConfigLastWrite:{id:operationId,before,after,createdAt:new Date()}},$inc:{welcomeConfigRevision:1}}
    if(publication){
     const draft=old?.configurationDrafts?.welcome
     if(!draft||draft.schemaVersion!==1||draft.state!=='editing'||draft.revision!==publication.draftRevision||draft.baseRevision!==expectedRevision||draft.config.channelId!==wanted.channelId||draft.config.message!==wanted.message)fail('El borrador cambió desde que lo revisaste.','configuration_conflict')
     filter['configurationDrafts.welcome']={$eq:draft}
     update.$set['configurationDrafts.welcome']={...draft,state:'published',baseRevision:after.revision,updatedBy:publication.actorId,updatedAt:new Date()}
     Object.assign(update.$set.welcomeConfigLastWrite,{actorId:publication.actorId,draftRevision:publication.draftRevision})
    }
    const query=settings.model.findOneAndUpdate(filter,update,{new:true,upsert:!old,setDefaultsOnInsert:false})
    const saved=await(typeof query?.lean==='function'?query.lean():query)
    if(!saved)fail('La bienvenida cambió durante el guardado.','configuration_conflict')
    publish(id,saved,cachedBefore);if(publication)settings.patchCached(id,{'configurationDrafts.welcome':saved.configurationDrafts.welcome});return configuration(saved)
   })}catch(error){if(error instanceof ConfigurationError)throw error;if(error.code===11000)fail('La bienvenida cambió durante el guardado.','configuration_conflict');fail('No se pudo guardar la bienvenida.','configuration_storage')}
  },
 }
}
const services=new WeakMap()
function welcomeConfiguration(settings){if(!services.has(settings))services.set(settings,createWelcomeConfiguration(settings));return services.get(settings)}
module.exports={createWelcomeConfiguration,welcomeConfiguration,configuration,validatePatch,ConfigurationError}
