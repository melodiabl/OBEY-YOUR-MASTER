const {BlueprintError}=require('../architect/blueprint')
const {validateTemplate}=require('./format')
function officialTemplates(){
 const {wizardCatalog,generateProposal}=require('../architect/wizard'),{captureTemplate}=require('./format')
 return wizardCatalog().communities.map(community=>{
  const source={guildId:'official',revision:'official-v1',channels:[],roles:[]}
  const blueprint=generateProposal({schemaVersion:1,baseRevision:source.revision,channels:[],roles:[],protectedIds:[]},{community:community.id,title:community.label,theme:'minimal',size:'small',language:'es',decoration:'none',spaces:[]}).blueprint
  return{id:`official:${community.id}`,version:1,definition:captureTemplate(blueprint,source,{name:community.label,description:`Base de estructura para ${community.label.toLowerCase()}.`,selection:'all'})}
 })
}
function createTemplateService({repository,architect,storageReady=()=>true}){
 const ready=()=>Boolean(repository&&storageReady())
 const requireStorage=()=>{if(!ready())throw new BlueprintError('Template storage unavailable','storage_unavailable')}
 const summary=record=>({id:record.id,version:record.version,name:record.definition.name,description:record.definition.description,scope:record.definition.scope,channelCount:record.definition.channels.length,roleCount:record.definition.roles.length,createdAt:record.createdAt??null})
 return{
  async list(actorId){return{official:officialTemplates().map(summary),private:ready()?(await repository.list(actorId)).map(summary):[],storageAvailable:ready()}},
  async get(id,actorId){
   const official=officialTemplates().find(record=>record.id===id);if(official)return official
   requireStorage();const record=await repository.get(id,actorId)
   if(!record)throw new BlueprintError('Template not found','template_not_found')
   return{...record,definition:validateTemplate(record.definition)}
  },
  async capture(guild,actorId,blueprint,metadata){requireStorage();const definition=await architect.captureTemplate(guild,blueprint,metadata);return repository.create(actorId,definition)},
  async import(actorId,input){requireStorage();return repository.create(actorId,validateTemplate(input))},
  async preview(guild,actorId,blueprint,id){const record=await this.get(id,actorId);return architect.fromTemplate(guild,actorId,blueprint,record.definition)},
  async remove(id,actorId){requireStorage();if(!await repository.remove(id,actorId))throw new BlueprintError('Template not found','template_not_found');return true},
 }
}
module.exports={createTemplateService,officialTemplates}
