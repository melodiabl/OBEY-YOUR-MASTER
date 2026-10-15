const test=require('node:test'),assert=require('node:assert/strict')
const {buildApplicationButtons}=require('../handlers/tickets/application-buttons')
test('application controls keep all identities, distinct labels and native disabled states',()=>{
 const buttons=buildApplicationButtons('en')
 assert.equal(buttons.acceptbutton.toJSON().custom_id,'Apply_accept');assert.equal(buttons.acceptbutton.toJSON().label,'Accept');assert.equal(buttons.acceptbutton_d.toJSON().disabled,true)
 for(let n=1;n<=5;n++){assert.equal(buttons[`emoji${n}button`].toJSON().label,String(n));assert.equal(buttons[`emoji${n}button`].toJSON().custom_id,`Apply_${n}`)}
})
