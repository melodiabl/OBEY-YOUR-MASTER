const { BlueprintError, validateBlueprint } = require('../architect/blueprint')
const local = id => typeof id === 'string' && /^local:[a-zA-Z0-9_-]{1,64}$/.test(id)
const fail = (message, code = 'invalid_template') => { throw new BlueprintError(message, code) }
function validateTemplate(value) {
  try {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['format','schemaVersion','scope','name','description','channels','roles'].includes(key))) fail('Invalid template fields')
    if (value.format !== 'obey-template' || value.schemaVersion !== 1 || value.scope !== 'structure_only') fail('Unsupported template format/version')
    if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100 || typeof (value.description ?? '') !== 'string' || (value.description ?? '').length > 500) fail('Invalid template metadata')
    if (!Array.isArray(value.channels) || !Array.isArray(value.roles) || !value.channels.length && !value.roles.length) fail('Empty template')
    if (value.channels.some(item => !local(item.id) || item.position !== 0 || ![0,2,4].includes(item.type) || item.overwrites?.some(overwrite => overwrite.type !== 0 || overwrite.id !== 'everyone' && !local(overwrite.id))) || value.roles.some(item => !local(item.id) || item.position !== 1 || item.managed)) fail('Template requires logical references and default positions for editable resources')
    const everyone = {id:'everyone',name:'@everyone',position:0,permissions:'0',color:0,hoist:false,mentionable:false,managed:false}
    const source = {guildId:'everyone',revision:'portable-v1',channels:[],roles:[everyone]}
    const blueprint = validateBlueprint({schemaVersion:1,baseRevision:source.revision,channels:value.channels,roles:[everyone,...value.roles],protectedIds:[]},source)
    return {format:'obey-template',schemaVersion:1,scope:'structure_only',name:value.name.trim(),description:value.description??'',channels:blueprint.channels,roles:blueprint.roles.filter(role=>role.id!=='everyone')}
  } catch (error) { if (error.code === 'invalid_template') throw error; fail('Invalid portable template structure') }
}
function captureTemplate(blueprint, source, metadata) {
  if (!metadata || Object.keys(metadata).some(key=>!['name','description','selection'].includes(key)) || !['all','new'].includes(metadata.selection)) fail('Invalid template selection')
  const selectedChannels = new Map(), selectedRoles = new Map()
  const channelMap = new Map(blueprint.channels.map(item=>[item.id,item])), roleMap = new Map(blueprint.roles.map(item=>[item.id,item]))
  const unsupported = message => fail(message,'template_unsupported')
  function role(id) {
    if (id === source.guildId) return
    const item = roleMap.get(id)
    if (!item || item.managed) unsupported('Managed or unknown role cannot be transported')
    const colors = source.roleColors?.[id]
    if (!id.startsWith('local:') && (!colors || colors.secondaryColor != null || colors.tertiaryColor != null)) unsupported('Special or unknown role colors cannot be transported')
    selectedRoles.set(id,item)
  }
  function channel(id) {
    if (selectedChannels.has(id)) return
    const item = channelMap.get(id)
    if (!item || ![0,2,4].includes(item.type)) unsupported('Unsupported channel type')
    selectedChannels.set(id,item)
    if (item.parentId) channel(item.parentId)
    for (const overwrite of item.overwrites) { if (overwrite.type !== 0) unsupported('Member overwrites cannot be transported'); role(overwrite.id) }
  }
  for (const item of blueprint.channels) if (metadata.selection === 'all' || item.id.startsWith('local:')) channel(item.id)
  for (const item of blueprint.roles) if (!item.managed && item.id !== source.guildId && (metadata.selection === 'all' || item.id.startsWith('local:'))) role(item.id)
  const channels=[...selectedChannels.values()].sort((a,b)=>a.type===4&&b.type!==4?-1:b.type===4&&a.type!==4?1:a.position-b.position||a.id.localeCompare(b.id))
  const roles=[...selectedRoles.values()].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id))
  const ids=new Map([[source.guildId,'everyone'],...channels.map((item,index)=>[item.id,`local:c${index+1}`]),...roles.map((item,index)=>[item.id,`local:r${index+1}`])])
  return validateTemplate({format:'obey-template',schemaVersion:1,scope:'structure_only',name:metadata.name,description:metadata.description??'',
    channels:channels.map(item=>({...structuredClone(item),id:ids.get(item.id),position:0,parentId:item.parentId?ids.get(item.parentId):null,overwrites:item.overwrites.map(overwrite=>({...overwrite,id:ids.get(overwrite.id)}))})),
    roles:roles.map(item=>({...structuredClone(item),id:ids.get(item.id),position:1}))})
}
module.exports = { captureTemplate, validateTemplate }
