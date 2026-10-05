const { createHash } = require('node:crypto')
const { isDeepStrictEqual } = require('node:util')
const { BlueprintError } = require('../architect/blueprint')
const { validateTemplate } = require('./format')
function mergeTemplate(input, source, value) {
  const definition=validateTemplate(value), blueprint=structuredClone(input), protectedIds=new Set(blueprint.protectedIds||[])
  const key=createHash('sha256').update(JSON.stringify({channels:definition.channels,roles:definition.roles})).digest('hex').slice(0,16)
  const ids=new Map([['everyone',source.guildId]]), initial={channels:blueprint.channels.length,roles:blueprint.roles.length}
  const logicalId=id=>`local:tpl-${key}-${createHash('sha256').update(id).digest('hex').slice(0,16)}`
  const conflict=()=>{throw new BlueprintError('Template conflicts with a destination resource','template_conflict')}
  const equal=(actual,desired,fields)=>fields.every(field=>isDeepStrictEqual(actual[field],desired[field]))
  function reuse(kind, desired, fields) {
    const byId=blueprint[kind].find(item=>item.id===desired.id)
    const matches=byId?[byId]:blueprint[kind].filter(item=>item.name===desired.name&&(kind==='roles'||item.type===desired.type&&item.parentId===desired.parentId))
    if (matches.length>1) conflict()
    const existing=matches[0]
    if(existing&&!equal(existing,desired,fields)) conflict()
    return existing
  }
  for(const role of definition.roles){
    const desired={...structuredClone(role),id:logicalId(role.id),position:1}
    const existing=reuse('roles',desired,['name','permissions','color','hoist','mentionable','managed'])
    const colors=existing&&source.roleColors?.[existing.id]
    if(existing&&!existing.id.startsWith('local:')&&(!colors||colors.secondaryColor!=null||colors.tertiaryColor!=null)) conflict()
    if(!existing)blueprint.roles.push(desired)
    ids.set(role.id,(existing||desired).id)
  }
  const ordered=[...definition.channels].sort((a,b)=>(a.type===4?0:1)-(b.type===4?0:1)||a.id.localeCompare(b.id))
  for(const channel of ordered){
    const desired={...structuredClone(channel),id:logicalId(channel.id),position:0,parentId:channel.parentId?ids.get(channel.parentId):null,
      overwrites:channel.overwrites.map(overwrite=>({...overwrite,id:ids.get(overwrite.id)})).sort((a,b)=>a.id.localeCompare(b.id))}
    const existing=reuse('channels',desired,['name','type','parentId','topic','nsfw','bitrate','userLimit','rateLimitPerUser','overwrites'])
    if(!existing&&desired.parentId&&protectedIds.has(desired.parentId))conflict()
    if(!existing)blueprint.channels.push(desired)
    ids.set(channel.id,(existing||desired).id)
  }
  return{blueprint,template:{name:definition.name,addedChannels:blueprint.channels.length-initial.channels,addedRoles:blueprint.roles.length-initial.roles,
    reused:definition.channels.length+definition.roles.length-(blueprint.channels.length-initial.channels)-(blueprint.roles.length-initial.roles),scope:definition.scope}}
}
module.exports={mergeTemplate}
