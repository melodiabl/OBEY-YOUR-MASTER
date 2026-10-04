const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createDraftRepository } = require('../handlers/architect/repository')
test('draft repository rejects injected scopes before accessing MongoDB',async()=>{
 const repository=createDraftRepository({init:assert.fail,findOne:assert.fail})
 await assert.rejects(repository.get({$ne:''},'u'),/Invalid guild or actor/)
 await assert.rejects(repository.save('g',{$ne:''},{},0),/Invalid guild or actor/)
 await assert.rejects(repository.save('g','u',{},NaN),/draft revision/)
})
