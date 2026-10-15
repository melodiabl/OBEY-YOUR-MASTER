const test=require('node:test'),assert=require('node:assert/strict')
const views=require('../handlers/economy/messages')
test('money input rejects partial, fractional, unsafe and negative amounts',()=>{
 for(const input of ['10abc','1.5','-1','0','Infinity','1e3','9007199254740992',''])assert.equal(views.parseAmount(input,100),null,input)
 assert.equal(views.parseAmount(' 10 ',100),10);assert.equal(views.parseAmount('todo',20),20);assert.equal(views.parseAmount('all',0),null)
})
function fixture(wallet=100,bank=20){
 const accounts=new Map([['guild-user',{balance:wallet,bank}]]),writes=[],replies=[]
 const economy={has:(key,field)=>field?Object.hasOwn(accounts.get(key)||{},field):accounts.has(key),get:(key,field)=>field?accounts.get(key)?.[field]:accounts.get(key),set:(key,value)=>accounts.set(key,value),ensure:(key,value,field)=>{if(field){if(!Object.hasOwn(accounts.get(key),field))accounts.get(key)[field]=value}else if(!accounts.has(key))accounts.set(key,value)},math:(key,op,amount,field)=>{writes.push({key,op,amount,field});accounts.get(key)[field]+=op==='+'?amount:-amount}}
 const client={settings:{get:(_,key)=>key==='ECONOMY'?true:'en'},economy}
 const user={id:'user',username:'User',bot:false,displayAvatarURL:()=> 'https://example.com/avatar.png'}
 const interaction={guild:{id:'guild',name:'Guild'},user,options:{getString:()=> '10',getUser:()=>null},reply:async payload=>replies.push(payload)}
 return {client,interaction,accounts,writes,replies}
}
test('malformed deposit changes neither wallet nor bank and returns translated error',async()=>{
 const f=fixture();f.interaction.options.getString=()=> '10abc'
 await require('../slashCommands/Economy/depositar').run(f.client,f.interaction)
 assert.equal(f.writes.length,0);assert.match(f.replies[0].embeds[0].toJSON().description,/whole amount/)
})
test('deposit and withdrawal retain balances and use shared bank/coins presentation',async()=>{
 const f=fixture()
 await require('../slashCommands/Economy/depositar').run(f.client,f.interaction)
 assert.equal(f.accounts.get('guild-user').balance,90);assert.equal(f.accounts.get('guild-user').bank,30)
 assert.match(f.replies[0].embeds[0].toJSON().title,/Deposit completed/)
 await require('../slashCommands/Economy/retirar').run(f.client,f.interaction)
 assert.equal(f.accounts.get('guild-user').balance,100);assert.equal(f.accounts.get('guild-user').bank,20)
})
test('unsafe transfer is rejected before debit or credit',async()=>{
 const f=fixture();f.interaction.options.getInteger=()=> null;f.interaction.options.getUser=()=>({id:'other',bot:false})
 await require('../slashCommands/Economy/pay').run(f.client,f.interaction)
 assert.equal(f.writes.length,0)
})
