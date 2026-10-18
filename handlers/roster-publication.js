const { z } = require('zod')
const { EmbedBuilder, escapeMarkdown } = require('discord.js')
const { createSetupSettings } = require('./setup-settings')
const { publishSavedMessage, retireSavedMessage } = require('./setup-publications')
const { label, ids, snowflake, field, channel } = require('./setup-fields')
const { parseColor } = require('./setup-definitions')
function rosterFields(number) {
  if (!Number.isInteger(number) || number < 1 || number > 100) throw new Error('invalid_setup_definition')
  const root = `roster${number}`
  return {
    channel: channel(`${root}.rosterchannel`, 'notvalid', 'Canal', 'Channel'),
    roles: field(`${root}.rosterroles`, 'roles', [], ids, 'Roles de la lista', 'Listed roles', { clear: [], permissionOnly: true, allowEveryone: true }),
    title: field(`${root}.rostertitle`, 'text', 'Roster', z.string().min(1).max(256), 'Título', 'Title', { maxInput: 256 }),
    emoji: field(`${root}.rosteremoji`, 'text', '➤', z.string().max(100), 'Símbolo por miembro', 'Member symbol', { allowEmpty: true, maxInput: 100, clear: '' }),
    style: field(`${root}.rosterstyle`, 'enum', '1', z.enum(['1','2','3','4','5','6','7']), 'Formato de miembros', 'Member format', { options: ['1','2','3','5','6'], labels: {
      '1': label('Mención y nombre en código', 'Mention and code name'), '2': label('Solo mención', 'Mention only'), '3': label('Nombre en negrita', 'Bold name'), '4': label('Nombre en negrita', 'Bold name'), '5': label('Mención e ID', 'Mention and ID'), '6': label('Mención y nombre en negrita', 'Mention and bold name'), '7': label('Mención y nombre en negrita', 'Mention and bold name'),
    } }),
    inline: field(`${root}.inline`, 'boolean', false, z.boolean(), 'Columnas', 'Columns'),
    all: field(`${root}.showallroles`, 'boolean', false, z.boolean(), 'Mostrar más de 20 miembros por rol', 'Show more than 20 members per role', { hint: label('Amplía la lista hasta el límite del mensaje de Discord; el contador del rol conserva su total.', 'Expands the list within Discord message limits; the role count keeps its total.') }),
    message: field(`${root}.rostermessage`, 'text', '', z.union([z.literal(''), snowflake]), 'ID de mensaje existente (opcional)', 'Existing message ID (optional)', { allowEmpty: true, maxInput: 20, clear: '' }),
  }
}
async function rosterEmbed(client, guild, values, { hydrate = true } = {}) {
  if (hydrate && values.roles?.length) await guild.members.fetch()
  const color = parseColor(client.settings.get(guild.id, 'embed.color')) ?? 0xFFD36F
  const embed = new EmbedBuilder().setColor(color).setTitle(values.title || 'Roster')
  const selectedRoles = [...new Set(values.roles || [])].slice(0, 25), populations = new Map(selectedRoles.map(id => [id, { size: 0, visible: [] }]))
  for (const member of guild.members.cache.values()) for (const id of member.roles?.cache?.keys() || []) {
    const population = populations.get(id)
    if (population) { population.size++; if (population.visible.length < (values.all ? 500 : 20)) population.visible.push(member) }
  }
  for (const id of selectedRoles) {
    if (embed.data.fields?.length >= 25 || embed.length > 4900) break
    const role = await guild.roles.fetch(id).catch(error => { if (error.code === 10011) return null; throw error })
    if (!role) continue
    const members = populations.get(id)
    const names = members.visible.map(member => {
      const name = escapeMarkdown(member.user.username), mention = `<@${member.id}>`, prefix = values.emoji || ''
      const content = { '1': `${mention} | \`${name}\``, '2': mention, '3': `**${name}**`, '4': `**${name}**`, '5': `${mention} | \`${member.id}\``, '6': `${mention} | **${name}**`, '7': `${mention} | **${name}**` }[values.style] || mention
      return `${prefix} ${content}`.trim()
    })
    const pages = values.all ? Math.max(1, Math.ceil(names.length / 20)) : 1
    for (let page = 0; page < pages; page++) {
      const title = `${role.name} [${members.size}]${page ? ` (${page + 1})` : ''}`.slice(0, 256)
      let content = names.slice(page * 20, page * 20 + 20).join('\n') || '—'
      if (!values.all && members.size > 20) content += `\n… +${members.size - 20}`
      content = content.slice(0, Math.min(1024, Math.max(1, 5700 - embed.length - title.length)))
      if (embed.data.fields?.length >= 25 || embed.length + title.length + content.length > 5800) break
      embed.addFields({ name: title, value: content, inline: Boolean(values.inline) })
    }
  }
  if (!embed.data.fields?.length) embed.setDescription('Sin miembros para mostrar / No members to display')
  return embed
}
function rosterPort(client, guildId, number, { hydrate = true, store = client.roster } = {}) {
  const fields = { ...rosterFields(number), nonce: { path: `roster${number}.publicationNonce`, default: '', schema: z.string().max(24) } }
  // This port is used inside admitted operations; shutdown drains them before flushing.
  const service = createSetupSettings(store, fields)
  const snapshot = value => ({ ...value, channelId: value.values.channel, messageId: value.values.message, nonce: value.values.nonce })
  return { key: `roster${number}`, label: `Lista ${number}`,
    async read() { const value = await service.read(guildId); for (const [id, field] of Object.entries(fields)) if (!field.schema.safeParse(value.values[id]).success) throw new Error('invalid_setup'); return snapshot(value) },
    async save(value, patch) { return snapshot(await service.save(guildId, { ...(patch.messageId !== undefined ? { message: patch.messageId } : {}), ...(patch.nonce !== undefined ? { nonce: patch.nonce } : {}) }, value.revision)) },
    async payload({ guild }, value) { return { embeds: [await rosterEmbed(client, guild, value.values, { hydrate })] } },
  }
}
function publishRoster(client, context, number, options) { return publishSavedMessage(client, context, rosterPort(client, context.guildId, number, options), options) }
function retireRoster(client, context, number) { return retireSavedMessage(client, context, rosterPort(client, context.guildId, number)) }
module.exports = { rosterFields, rosterEmbed, rosterPort, publishRoster, retireRoster }
