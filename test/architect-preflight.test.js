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
test('enabled channel edits require effective permission on the target channel',async()=>{
 const member={id:'u',permissions:{has:()=>true},roles:{highest:{position:10}}}
 const guild={members:{fetch:async()=>member,fetchMe:async()=>member},channels:{cache:new Map([['chat',{permissionsFor:()=>({has:()=>false})}]])}}
 const report=await preflight(guild,{roles:[]},{changes:[{kind:'channels',id:'chat',operation:'update',field:'name',after:'approved'}]},'u',{executionAvailable:true})
 assert.equal(report.status,'blocked');assert.equal(report.checks.find(check=>check.code==='bot_channel_chat').status,'failed')
})
test('single-color application cannot overwrite a gradient or an unknown role style',async()=>{
 const member={id:'u',permissions:{has:()=>true},roles:{highest:{position:10}}}
 const guild={members:{fetch:async()=>member,fetchMe:async()=>member},roles:{cache:new Map([['staff',{colors:{primaryColor:1,secondaryColor:2,tertiaryColor:null}}]])}}
 const report=await preflight(guild,{roles:[{id:'staff',name:'Staff',position:1}]},{changes:[{kind:'roles',id:'staff',operation:'update',field:'color',after:123}]},'u',{executionAvailable:true})
 assert.equal(report.status,'blocked');assert.equal(report.checks.find(check=>check.code==='color_style_staff').status,'failed')
 guild.roles.cache.clear()
 const unknown=await preflight(guild,{roles:[{id:'staff',name:'Staff',position:1}]},{changes:[{kind:'roles',id:'staff',operation:'update',field:'color',after:123}]},'u',{executionAvailable:true})
 assert.equal(unknown.status,'incomplete')
})

test('channel creations require audit capability, parent access, capacity and supported voice bitrate', async () => {
 const { PermissionsBitField, Client } = require('discord.js')
 const client = new Client({ intents: [] }), member = { id: 'u', permissions: new PermissionsBitField(8n), roles: { highest: { position: 10 } } }
 const parent = { id: 'parent', type: 4, overwrites: [] }
 const channel = { id: 'local:voice', name: 'Voice', type: 2, parentId: 'parent', position: 0, topic: '', nsfw: false, bitrate: 64000, userLimit: 0, rateLimitPerUser: 0, overwrites: [] }
 const guild = { client, maximumBitrate: 96000, members: { fetch: async () => member, fetchMe: async () => member }, channels: { cache: new Map([['parent', { permissionsFor: () => new PermissionsBitField(8n) }]]) } }
 const blueprint = { roles: [], channels: [parent, channel] }, diff = { changes: [{ kind: 'channels', id: channel.id, operation: 'create', after: channel }] }
 try {
  assert.equal((await preflight(guild, blueprint, diff, 'u', { executionAvailable: true })).status, 'passed')
  channel.bitrate = 128000
  assert.equal((await preflight(guild, blueprint, diff, 'u', { executionAvailable: true })).status, 'blocked')
  channel.bitrate = 64000; parent.overwrites = [{ id: 'everyone', type: 0, allow: '0', deny: '1024' }]
  assert.equal((await preflight(guild, blueprint, diff, 'u', { executionAvailable: true })).status, 'blocked')
  parent.overwrites = []; blueprint.roles = Array.from({ length: 251 }, (_, index) => ({ id: `r${index}` }))
  assert.equal((await preflight(guild, blueprint, diff, 'u', { executionAvailable: true })).status, 'blocked')
 } finally { await client.destroy() }
})
