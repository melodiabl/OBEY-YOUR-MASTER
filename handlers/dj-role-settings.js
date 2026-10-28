const { z } = require('zod')
const { PermissionFlagsBits: F } = require('discord.js')
const { createSetupSettings } = require('./setup-settings')
const { requireSetupAccess } = require('./setup-access')
const ids = z.array(z.string().regex(/^\d{17,20}$/)).refine(value => new Set(value).size === value.length)
function fail(code) { throw Object.assign(new Error(code), { code }) }
function createDjRoleSettings(client) {
  return createSetupSettings(client.settings, { roles: { path: 'djroles', default: [], schema: ids } },
    () => Boolean(client._shuttingDown || client._dbReady === false))
}
async function authorize(client, context) {
  if (client._shuttingDown || client._dbReady === false) fail('setup_unavailable')
  const guild = client.guilds?.cache?.get(context.guildId)
  if (!guild || guild.available === false) fail('setup_denied')
  const roles = await guild.roles.fetch()
  if (context.transport === 'web') {
    const actor = await guild.members.fetch({ user: context.actorId, force: true })
    if (actor?.id !== context.actorId || actor.guild?.id !== guild.id || !actor.permissions.has(F.ManageGuild)) fail('setup_denied')
  } else if (context.transport === 'prefix') await requireSetupAccess(client, context)
  else fail('setup_denied')
  if (client._shuttingDown || client._dbReady === false) fail('setup_unavailable')
  return roles
}
async function readDjRoles(client, context) {
  await authorize(client, context)
  const result = await createDjRoleSettings(client).read(context.guildId)
  await authorize(client, context)
  if (!ids.safeParse(result.values.roles).success) fail('setup_storage')
  return result
}
async function replaceDjRoles(client, context, roleIds, revision) {
  if (!ids.safeParse(roleIds).success) fail('invalid_setup')
  const roles = await authorize(client, context)
  if (roleIds.some(id => roles.get(id)?.guild?.id !== context.guildId)) fail('invalid_dj_role')
  return createDjRoleSettings(client).save(context.guildId, { roles: roleIds }, revision)
}
async function changeDjRole(client, context, roleId, action) {
  if (!/^\d{17,20}$/.test(roleId || '') || !['add', 'remove'].includes(action)) fail('invalid_dj_role')
  const before = await readDjRoles(client, context)
  if (action === 'add') {
    const roles = await authorize(client, context)
    if (roles.get(roleId)?.guild?.id !== context.guildId) fail('invalid_dj_role')
  } else await authorize(client, context)
  const has = before.values.roles.includes(roleId)
  if (has === (action === 'add')) return { status: 'unchanged', roles: before.values.roles }
  const values = action === 'add' ? [...before.values.roles, roleId] : before.values.roles.filter(id => id !== roleId)
  // Removal can clean up a role that Discord no longer returns.
  const saved = await createDjRoleSettings(client).save(context.guildId, { roles: values }, before.revision)
  return { status: action === 'add' ? 'added' : 'removed', roles: saved.values.roles }
}
module.exports = { createDjRoleSettings, readDjRoles, replaceDjRoles, changeDjRole }
