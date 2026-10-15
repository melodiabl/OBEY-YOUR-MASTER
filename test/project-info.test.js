const test=require('node:test'),assert=require('node:assert/strict')
const {runProjectInfo,publicHttps}=require('../handlers/project/info')
test('public links reject credentials and unsafe protocols',()=>{
 assert.equal(publicHttps('https://user:secret@example.com'),null);assert.equal(publicHttps('javascript:alert(1)'),null);assert.equal(publicHttps('https://example.com'), 'https://example.com/')
})
test('project info does not advertise unrelated sponsors, repositories or another bot invite',async()=>{
 const client={user:{username:'OBEY',displayAvatarURL:()=> 'https://example.com/avatar.png'},settings:{get:()=> 'en'}},responses=[]
 const message={guild:{id:'guild'},reply:async data=>responses.push(data)}
 await runProjectInfo(client,message,'sponsor',{repository:'',support:'',contact:''})
 const json=JSON.stringify(responses[0]);assert.doesNotMatch(json,/bero|bittmax|paypal|734513783338434591/i);assert.equal(responses[0].components.length,0)
 await runProjectInfo(client,message,'github',{repository:'https://github.com/example/obey'})
 assert.equal(responses[1].components[0].toJSON().components[0].url,'https://github.com/example/obey')
})
