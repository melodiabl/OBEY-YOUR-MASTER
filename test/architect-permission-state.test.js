const { test } = require('node:test')
const assert = require('node:assert/strict')
const { setRolePermission, setOverwritePermission, permissionOptions } = require('../dashboard/public/js/architect-permission-state')
const { PermissionFlagsBits } = require('discord.js')
test('permission controls preserve unknown flags and unrelated role/member overwrites', () => {
  for (const option of permissionOptions) assert.equal(BigInt(option.bit), PermissionFlagsBits[option.key])
  const future = 1n << 60n
  assert.equal(setRolePermission(String(future), '2048', true), String(future | 2048n))
  assert.equal(setRolePermission(String(future | 2048n), '2048', false), String(future))
  const source = [{ id: 'r', type: 0, allow: String(future | 2048n), deny: '0' }, { id: 'member', type: 1, allow: '0', deny: '1024' }]
  const denied = setOverwritePermission(source, 'r', '2048', 'deny')
  assert.equal(denied.find(overwrite => overwrite.id === 'r').allow, String(future))
  assert.equal(denied.find(overwrite => overwrite.id === 'r').deny, '2048')
  assert.deepEqual(denied.find(overwrite => overwrite.id === 'member'), source[1])
  assert.equal(source[0].deny, '0')
  const inherited = setOverwritePermission([{ id: 'r', type: 0, allow: '2048', deny: '0' }], 'r', '2048', 'inherit')
  assert.deepEqual(inherited, [])
  assert.throws(() => setOverwritePermission(source, 'r', '2048', 'anything'), /Invalid/)
})
