const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PermissionFlagsBits } = require('discord.js')
const command=require('../slashCommands/Config/architect')
test('Discord Architect uses the same private proposal service and reports its real snapshot',async()=>{
 let result,reads=0
 const member={permissions:{has:flag=>flag===PermissionFlagsBits.ManageGuild}}
 const interaction={member,user:{id:'u'},guild:{id:'g',name:'Guild',members:{fetch:async options=>{assert.equal(options.force,true);return member}}},async deferReply(){},async editReply(payload){result=payload}}
 const client={architect:{async read(guild,actor){reads++;assert.equal(actor,'u');return {snapshot:{channels:[{type:4},{type:0}],roles:[{}],revision:'revision',warnings:[]},draft:null}}}}
 await command.run(client,interaction)
 assert.equal(reads,1);assert.equal(result.embeds[0].data.fields[0].value.includes('1 categoría'),true)
 assert.deepEqual(result.allowedMentions,{parse:[]})
})
test('unauthorized Discord members cannot read Architect snapshots',async()=>{
 let reply
 await command.run({architect:{read:assert.fail}},{member:{permissions:{has:()=>false}},reply:async payload=>{reply=payload}})
 assert.equal(reply.ephemeral,true)
})
test('Discord schedules the same persistent analysis with an interaction idempotency key',async()=>{
 let submitted,reply
 const member={permissions:{has:()=>true}}
 const interaction={id:'123',member,user:{id:'u'},options:{getString:()=> 'analizar'},guild:{id:'g',members:{fetch:async()=>member}},async deferReply(){},async editReply(payload){reply=payload}}
 await command.run({architect:{read:assert.fail},jobs:{available:()=>true,submit:async input=>{submitted=input;return {id:'job',status:'queued'}}}},interaction)
 assert.deepEqual(submitted,{guildId:'g',actorId:'u',type:'architect.snapshot',idempotencyKey:'discord-123'})
 assert.equal(reply.content.includes('encolado'),true)
})
