const { test } = require('node:test')
const assert = require('node:assert/strict')
const { preflight } = require('../handlers/architect/preflight')
test('preflight checks the real actor and bot capabilities and role hierarchy',async()=>{
 const members={u:{id:'u',permissions:{has:()=>true},roles:{highest:{position:10}}},bot:{id:'bot',permissions:{has:()=>false},roles:{highest:{position:5}}}}
 const guild={ownerId:'owner',members:{fetch:async options=>{assert.equal(options.force,true);return members[options.user]},fetchMe:async()=>members.bot}}
 const report=await preflight(guild,{roles:[{id:'role',name:'Staff',position:7}]},{changes:[{kind:'roles',id:'role',operation:'update'}]},'u')
 assert.equal(report.status,'blocked')
 assert.equal(report.checks.find(check=>check.code==='bot_roles').status,'failed')
 assert.equal(report.checks.find(check=>check.code==='hierarchy_role').status,'failed')
 assert.equal(report.checks.find(check=>check.code==='actor_roles').status,'passed')
})
test('unavailable permissions never become a successful preflight',async()=>{
 const report=await preflight({}, {roles:[]},{changes:[{kind:'channels',id:'local:x',operation:'create'}]},'u')
 assert.equal(report.status,'incomplete');assert.equal(report.checks.some(check=>check.code==='bot_channels'&&check.status==='unknown'),true)
})

test('role grants must be held by both the actor and OBEY',async()=>{
 const { PermissionsBitField }=require('discord.js')
 const member={id:'u',permissions:new PermissionsBitField(['ManageGuild','ManageRoles']),roles:{highest:{position:10}}}
 const report=await preflight({ownerId:'owner',members:{fetch:async()=>member,fetchMe:async()=>member}}, {roles:[{id:'local:admin',name:'Admin',permissions:'8',position:1}]},{changes:[{kind:'roles',id:'local:admin',operation:'create'}]},'u')
 assert.equal(report.checks.find(check=>check.code==='actor_grant_local:admin').status,'failed')
 assert.equal(report.status,'blocked')
})
