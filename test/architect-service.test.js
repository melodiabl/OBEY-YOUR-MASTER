const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createArchitectService } = require('../handlers/architect/service')
const base = () => ({ schemaVersion:1,guildId:'g',revision:'revision',channels:[],roles:[],warnings:[] })
const blueprint = () => ({baseRevision:'revision',channels:[],roles:[]})
test('saving a proposal validates against a fresh snapshot before writing', async()=>{
 let reads=0,writes=0
 const service=createArchitectService({snapshot:async()=>{reads++;return base()},repository:{async save(guild,actor,data,revision){writes++;assert.equal(guild,'g');assert.equal(actor,'u');assert.equal(revision,0);assert.equal(data.blueprint.baseRevision,'revision');return {draftRevision:1,...data}}}})
 const saved=await service.save({id:'g'},'u',blueprint(),0)
 assert.equal(saved.draftRevision,1);assert.equal(reads,1);assert.equal(writes,1)
 await assert.rejects(service.save({id:'g'},'u',{...blueprint(),baseRevision:'stale'},1),/revision/)
 assert.equal(writes,1)
})
test('failed storage and draft conflicts are exposed without acknowledging a save',async()=>{
 const service=createArchitectService({snapshot:async()=>base(),repository:{async save(){throw new Error('storage unavailable')}}})
 await assert.rejects(service.save({id:'g'},'u',blueprint(),0),/storage unavailable/)
 await assert.rejects(service.save({id:'g'},'u',blueprint(),-1),/draft revision/)
})
test('draft reads are scoped to the guild and actor and stale drafts remain identifiable',async()=>{
 const service=createArchitectService({snapshot:async()=>base(),repository:{async get(guild,actor){assert.equal(guild,'g');assert.equal(actor,'u');return {blueprint:{baseRevision:'old'},draftRevision:2}}}})
 const state=await service.read({id:'g'},'u')
 assert.equal(state.draftStale,true);assert.equal(state.draft.draftRevision,2)
})
