const {randomUUID}=require('node:crypto')
const {BlueprintError}=require('../architect/blueprint')
function createTemplateRepository(model=require('../../database/schemas/TemplateSchema')){
 const actor=ownerId=>{if(typeof ownerId!=='string'||!/^[a-zA-Z0-9_:-]{1,100}$/.test(ownerId))throw new BlueprintError('Invalid template owner','invalid_template')}
 const scope=(id,ownerId)=>{actor(ownerId);if(typeof id!=='string'||! /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))throw new BlueprintError('Invalid template ID','template_not_found');return{_id:id,ownerId}}
 const project=record=>record&&({id:record._id,version:record.version,definition:record.definition,createdAt:record.createdAt})
 return{
  async create(ownerId,definition){actor(ownerId);await model.init();return project((await model.create({_id:randomUUID(),ownerId,version:1,definition})).toObject())},
  async list(ownerId){actor(ownerId);await model.init();return(await model.find({ownerId}).sort({createdAt:-1,_id:1}).limit(50).lean()).map(project)},
  async get(id,ownerId){const filter=scope(id,ownerId);await model.init();return project(await model.findOne(filter).lean())},
  async remove(id,ownerId){const filter=scope(id,ownerId);await model.init();return(await model.deleteOne(filter)).deletedCount===1},
 }
}
module.exports={createTemplateRepository}
