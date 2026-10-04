const { test } = require('node:test')
const assert = require('node:assert/strict')
const create = require('../dashboard/public/js/player-lyrics')
const state = (playbackId=1,elapsed=0,paused=false) => ({active:true,sessionId:'s',playbackId,current:{identifier:'t',elapsed},paused})
test('closed panel performs no lookup; opening paginates the full lyrics',async()=>{
 let calls=0,view
 const controller=create({load:async()=>{calls++;return {status:'ready',sessionId:'s',playbackId:1,mode:'plain',text:Array.from({length:51},(_,i)=>`Line ${i}`).join('\n'),lines:[]}},render:v=>{view=v},now:()=>0})
 controller.receive(state());assert.equal(calls,0)
 await controller.open();assert.equal(calls,1);assert.equal(view.total,3)
 controller.page(2);assert.equal(view.text.includes('Line 50'),true)
})
test('late requests cannot replace the lyrics of the current playback',async()=>{
 const waiting=[],views=[]
 const controller=create({load:()=>new Promise(resolve=>waiting.push(resolve)),render:v=>views.push(v),now:()=>0})
 controller.receive(state());const first=controller.open()
 controller.receive(state(2));waiting[1]({status:'ready',sessionId:'s',playbackId:2,mode:'plain',text:'new',lines:[]});await new Promise(resolve=>setImmediate(resolve))
 waiting[0]({status:'ready',sessionId:'s',playbackId:1,mode:'plain',text:'old',lines:[]});await first
 assert.equal(views.at(-1).text,'new')
})
test('synced highlight follows seeks and pause; disconnect freezes progress',async()=>{
 let now=0,view
 const controller=create({load:async()=>({status:'ready',sessionId:'s',playbackId:1,mode:'synced',text:'a\nb\nc',lines:[{ms:1000,text:'a'},{ms:3000,text:'b'},{ms:5000,text:'c'}]}),render:v=>{view=v},now:()=>now})
 controller.receive(state());await controller.open();assert.equal(view.activeLine,-1)
 now=4000;controller.tick();assert.equal(view.activeLine,1)
 controller.receive(state(1,1000,true));now=9000;controller.tick();assert.equal(view.activeLine,0)
 controller.receive(state(1,5000));controller.connection(false);now=15000;controller.tick();assert.equal(view.activeLine,2)
 controller.deny();assert.equal(view.status,'denied');assert.equal(view.text,'')
})
test('closing, idle, provider failures and retry leave no stale lyrics',async()=>{
 let fail=true,view
 const controller=create({load:async()=>{if(fail)throw Error('failure');return {status:'missing'}},render:v=>{view=v}})
 controller.receive(state());await controller.open();assert.equal(view.status,'unavailable')
 fail=false;await controller.retry();assert.equal(view.status,'missing')
 controller.receive({active:false});assert.equal(view.status,'idle')
 controller.close();assert.equal(view.open,false)
})
