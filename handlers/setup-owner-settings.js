const path = require('node:path')
const fs = require('node:fs/promises')
const { z } = require('zod')
const { label, ids, field } = require('./setup-fields')
const { openFormSetup } = require('./setup-form')
const { createFileSettings } = require('./setup-file-settings')
const configFile = path.join(__dirname,'../botconfig/config.json')
const advertisementFile = path.join(__dirname,'../botconfig/advertisement.json')
const denied=()=>{throw Object.assign(new Error('setup_denied'),{code:'setup_denied'})}
const owners = data => Array.isArray(data.ownerIDS) ? data.ownerIDS.filter(id=>typeof id==='string' && /^\d{17,20}$/.test(id)) : []
async function readOwnerIds(file=configFile) { const stat=await fs.lstat(file);if(!stat.isFile()||stat.isSymbolicLink())return [];return owners(JSON.parse(await fs.readFile(file,'utf8'))) }
function ownerAuthorization(file) { return async(_access,context)=>{if(!(await readOwnerIds(file)).includes(context.actorId))denied()} }
function ownerDefinition(client, file=configFile) {
  const fields={ownerIDS:field('ownerIDS','list',[],ids.min(1).max(100),'Propietarios del bot (un ID por línea)','Bot owners (one ID per line)',{maxInput:2100}),
    ownerGuildNotifications:field('ownerGuildNotifications','boolean',true,z.boolean(),'Avisos privados de entradas y salidas','Private server join and leave notices'),
    ownerNotificationsLanguage:field('ownerNotificationsLanguage','enum','es',z.enum(['es','en']),'Idioma de los avisos privados','Private notification language',{options:['es','en'],labels:{es:label('Español','Spanish'),en:label('Inglés','English')}})}
  return {title:label('Propietarios del bot','Bot owners'),fields,authorizeActor:ownerAuthorization(file),description:label('Solo propietarios del bot. Guarda para aplicar la lista. El propietario principal y tu propio acceso se conservan; solo los dos primeros propietarios pueden retirar a otros.','Bot owners only. Save to apply the list. The primary owner and your own access are preserved; only the first two owners can remove others.'),
    service(_client,context){return createFileSettings(client,{file,fields,authorize:document=>{if(!owners(document).includes(context.actorId))denied()},validate(next,previous){const old=owners(previous),updated=next.ownerIDS;if(new Set(updated).size!==updated.length||!updated.includes(old[0])||!updated.includes(context.actorId))denied();if(old.some(id=>!updated.includes(id))&&!old.slice(0,2).includes(context.actorId))denied()},publish(next){if(file===configFile)for(const key of Object.keys(fields))if(Object.hasOwn(next,key))require(configFile)[key]=structuredClone(next[key])}})},
    async validate(values){const current=await readOwnerIds(file);for(const id of values.ownerIDS.filter(id=>!current.includes(id))){const user=await client.users.fetch(id,{force:true});if(!user||user.id!==id||user.bot)throw Error('invalid_owner')}},
  }
}
function advertisementDefinition(client,{file=advertisementFile,ownerFile=configFile}={}) {
  const fields={adenabled:field('adenabled','boolean',false,z.boolean(),'Publicidad activada','Advertising enabled')}
  const authorizeActor=ownerAuthorization(ownerFile)
  let details = { name: '', text: '' }
  return {title:label('Publicidad del bot','Bot advertising'),fields,authorizeActor,description:label('Solo propietarios del bot. Guardar actualiza la preferencia global y la vista del proceso. Los textos y el estado de publicidad existentes se conservan.','Bot owners only. Save updates the global preference and live process view. Existing advertising text and activity are preserved.'),
    service(_client,context){return createFileSettings(client,{file,fields,authorize:()=>authorizeActor(null,context),observe(document){details={name:typeof document.statusad?.name==='string'?document.statusad.name:'',text:typeof document.textad==='string'?document.textad:''}},publish(next){if(file===advertisementFile)require(advertisementFile).adenabled=next.adenabled;client.ad={enabled:next.adenabled,statusad:next.statusad??null,spacedot:next.spacedot??' • ',textad:next.textad??''}}})},
    preview:()=>`${details.name||'—'}\n${details.text||'—'}`,
  }
}
const openOwnerSetup=(client,origin,kind)=>openFormSetup(client,origin,kind==='owners'?ownerDefinition(client):kind==='advertisement'?advertisementDefinition(client):(()=>{throw Error('invalid_setup_definition')})())
module.exports={openOwnerSetup,ownerDefinition,advertisementDefinition,readOwnerIds,ownerAuthorization}
