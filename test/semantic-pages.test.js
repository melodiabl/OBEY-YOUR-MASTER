const test=require('node:test'),assert=require('node:assert/strict')
const {buildQueueRows,buildControls}=require('../handlers/music/embeds')
const {buildLikedRows}=require('../handlers/music/likes')
test('queue and favorites pages keep routing IDs and disabled bounds with distinct page icons',()=>{
 for(const [build,prefix] of [[buildQueueRows,'mq'],[buildLikedRows,'lk']]){
  const buttons=build(1,2,'en')[0].toJSON().components
  assert.deepEqual(buttons.map(b=>b.custom_id),[`${prefix}_prev:1`,`${prefix}_close`,`${prefix}_next:1`])
  assert.deepEqual(buttons.map(b=>b.label),['Previous','Close','Next']);assert.equal(buttons[0].disabled,true);assert.equal(buttons[2].disabled,false)
 }
 const loop=buildControls({loop:'track',history:[],volume:100})[0].toJSON().components.find(b=>b.custom_id==='mp_loop')
 assert.equal(loop.emoji.name,'🔂');assert.equal(loop.label,'Repetir canción')
})
