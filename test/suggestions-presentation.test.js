const test=require('node:test'),assert=require('node:assert/strict')
const {EmbedBuilder}=require('discord.js')
const {voteButtons,updateVoteEmbed}=require('../handlers/suggestions/presentation')
test('suggestion buttons preserve identities, configured emoji and explicit vote counts',()=>{
 const buttons=voteButtons({approveemoji:'🔥'},{upvotes:2,downvotes:1},'en').toJSON().components
 assert.deepEqual(buttons.map(b=>b.custom_id),['Suggest_upvote','Suggest_downvote','Suggest_who'])
 assert.equal(buttons[0].emoji.name,'🔥');assert.equal(buttons[0].label,'For · 2');assert.equal(buttons[1].label,'Against · 1')
})
test('vote edit clones a received embed and preserves status without mutating source fields',()=>{
 const original=new EmbedBuilder().setTitle('Idea').setDescription('Proposal').addFields({name:'Old up',value:'0'},{name:'Old down',value:'0'},{name:'Status',value:'Pending'}).toJSON()
 const before=JSON.stringify(original)
 const result=updateVoteEmbed(original,{upvotes:3,downvotes:1},'en').toJSON()
 assert.equal(JSON.stringify(original),before);assert.equal(result.fields[0].value,'3 votes');assert.equal(result.fields[2].value,'Pending')
})
test('suggestion interaction acknowledges and edits a cloned received embed with the new vote buttons',async()=>{
 const {EventEmitter}=require('node:events'),client=new EventEmitter()
 const counts={user:'owner',voted_ppl:[],downvoted_ppl:[],upvotes:0,downvotes:0},calls=[]
 client.user={id:'bot'};client.settings={get:(key,field)=>key==='guild'?(field==='suggest.channel'?'channel':field==='language'?'en':{}):counts,math:(key,op,value,field)=>{counts[field]+=op==='+'?value:-value},push:(key,value,field)=>counts[field].push(value),remove:(key,value,field)=>{counts[field]=counts[field].filter(x=>x!==value)},set:(key,value,field)=>{counts[field]=value}}
 require('../handlers/suggest')(client)
 const payload=new EmbedBuilder().addFields({name:'Up',value:'0'},{name:'Down',value:'0'}).toJSON()
 const button={inGuild:()=>true,isButton:()=>true,customId:'Suggest_upvote',user:{id:'voter'},message:{id:'suggestion',guild:{id:'guild',available:true},channel:{id:'channel'},author:{id:'bot'},embeds:[payload],attachments:{size:0},edit:async data=>{calls.push('edit');assert.equal(data.embeds[0].toJSON().fields[0].value,'1 votes');assert.equal(data.components[0].toJSON().components[0].label,'For · 1')}},deferUpdate:async()=>calls.push('ack')}
 await client.listeners('interactionCreate')[0](button)
 assert.deepEqual(calls,['ack','edit']);assert.equal(counts.upvotes,1);assert.equal(payload.fields[0].value,'0')
})
